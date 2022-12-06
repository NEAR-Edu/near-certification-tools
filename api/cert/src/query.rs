pub fn expiration_query(
    expiration_days: &str,
    issued_at: &str,
    account_id: &str,
    start_of_day: &str,
) -> String {
    format!(
        r#"
        /* <--- START OF FIRST QUERY ---> */
        WITH long_period_of_inactivity AS (
          (
            SELECT 
              case
                /* return issue date as moment if days_between_issue_date_and_first_activity > 180 */
                when days_between_issue_date_and_first_activity >= ({expiration_days}::text)::numeric then TO_TIMESTAMP(({issued_at}::text)::numeric/1000000000)
                /* else, return the start date of first occurance of >=180 day inactivity period if present */
                else moment
              end as moment,
              case
                /* if first activity - issue date exceeds 180 days, return the difference in days */
                when days_between_issue_date_and_first_activity >= ({expiration_days}::text)::numeric then days_between_issue_date_and_first_activity
                /* else, return the days between start of inactivity period and the next activity date */
                else diff_to_next_activity
              end as diff_to_next_activity
            FROM (
              SELECT *,
                ((EXTRACT(epoch FROM first_activity) - ({issued_at}::text)::numeric / 1000000000) / 86400)::int AS days_between_issue_date_and_first_activity
              FROM (
                SELECT *,
                  /* 1 day = 60sec * 60min * 24h = 86400 sec*/
                  ((EXTRACT(epoch FROM moment_of_activity) - EXTRACT(epoch FROM LAG(moment_of_activity) over (ORDER BY moment_of_activity))) / 86400)::int AS diff_to_next_activity,
                  LAG(moment_of_activity) OVER (ORDER BY moment_of_activity) AS moment,
                  FIRST_VALUE(moment_of_activity) OVER(ORDER BY moment_of_activity) first_activity
                FROM (
                  SELECT
                    TO_TIMESTAMP(R."included_in_block_timestamp" / 1000000000) as moment_of_activity
                  FROM
                    PUBLIC.RECEIPTS R LEFT JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
                  WHERE
                    SIGNER_ACCOUNT_ID = '{account_id}'
                    /* double casting because of prisma template literal throwing 22P03 Error in DB */
                    AND R."included_in_block_timestamp" >= ({issued_at}::text)::numeric
                    AND R."included_in_block_timestamp" <= ({start_of_day}::text)::numeric
                ) as account_activity_dates
              ) as account_activity_periods
            ) as account_activity_periods_with_first_activity
            WHERE (diff_to_next_activity > ({expiration_days}::text)::numeric) OR (days_between_issue_date_and_first_activity > ({expiration_days}::text)::numeric)
            ORDER BY moment ASC
            LIMIT 1
          )
        /* <--- END OF FIRST QUERY ---> */

        /* <--- START OF SECOND QUERY, IN CASE FIRST QUERY DOESN'T MATCH CONDITIONS ---> */
        ), most_recent_activity AS (
          SELECT
            /* moment refers to the most recent activity date of account */
            moment,
            /* to match column numbers in both queries */
            CAST(NULL AS int) AS diff_to_next_activity
          FROM (
            SELECT TO_TIMESTAMP(R."included_in_block_timestamp" / 1000000000) as moment
            FROM
              PUBLIC.receipts R LEFT JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
            WHERE
              SIGNER_ACCOUNT_ID = '{account_id}'
              /* double casting because of prisma template literal throwing 22P03 Error in DB */
              AND R."included_in_block_timestamp" >= ({issued_at}::text)::numeric
              AND R."included_in_block_timestamp" <= ({start_of_day}::text)::numeric
          ) as receipt
          WHERE NOT EXISTS (TABLE long_period_of_inactivity)
          ORDER BY moment DESC
          LIMIT 1
        )
        /* <--- END OF SECOND QUERY ---> */

        /* <--- BINDING CTEs WITH UNION ALL. IF FIRST QUERY (long_period_of_inactivity) DOESN'T RETURN ANY RESULT, RUN SECOND QUERY (most_recent_activity) ---> */
        TABLE long_period_of_inactivity
        UNION ALL
        TABLE most_recent_activity
        "#
    )
}
