use chrono::{Datelike, Days, TimeZone, Utc};
use errors::APIResult;
use tokio_postgres::{NoTls, SimpleQueryMessage};

use crate::query::expiration_query;

const DB_URL: &'static str =
    "postgres://public_readonly:nearprotocol@mainnet.db.explorer.indexer.near.dev/mainnet_explorer";
const EXPIRATION_DAYS: u8 = 180;

fn get_start_of_day_in_nanoseconds() -> String {
    let now = Utc::now();
    let year = now.year();
    let month = now.month();
    let day = now.day();
    let start_of_day = Utc.with_ymd_and_hms(year, month, day, 0, 0, 0).unwrap();

    start_of_day.timestamp_nanos().to_string()
}

fn add_expiration_days(start_date: &str) -> String {
    let start_date = Utc.datetime_from_str(start_date, "%F %T%.6f%#z").unwrap();
    let expiration_days = Days::new(EXPIRATION_DAYS.into());
    let expiration_date = start_date.checked_add_days(expiration_days).unwrap();

    expiration_date.format("%FT%T+00:00").to_string()
}

pub async fn get_expiration(account_id: &str, issued_at: &str) -> APIResult<String> {
    let Ok((client, connection)) = tokio_postgres::connect(DB_URL, NoTls).await else {
        return Err(errors::APIError::DBConnectionError { database_url: DB_URL.to_string() });
    };

    tokio::spawn(async move {
        if let Err(error) = connection.await {
            // return Err(errors::APIError::DBConnectionError {
            //     database_url: DB_URL.to_string(),
            // });
            panic!("{error}");
        }
    });

    let start_of_day = get_start_of_day_in_nanoseconds();

    let Ok(rows) = client.simple_query(&expiration_query(
            &EXPIRATION_DAYS.to_string(),
            &format!("{issued_at}000000"),
            account_id,
            &start_of_day,
        )
    ).await else {
        return Err(errors::APIError::DBQueryExecutionError);
    };

    let issued_at = &Utc
        .datetime_from_str(issued_at, "%s")
        .unwrap()
        .format("%F %X%.6f%:::z")
        .to_string();

    if rows.len() == 0 {
        println!("No rows returned.");

        return Ok(add_expiration_days(issued_at));
    }

    let Some(query_message) = rows.get(0) else {
        println!("No rows returned.");

        return Ok(add_expiration_days(issued_at));
    };

    let SimpleQueryMessage::Row(row) = query_message else {
        println!("No rows returned.");

        return Ok(add_expiration_days(issued_at));
    };

    let moment = row.get("moment").unwrap();
    let diff_to_next_activity = row.get("diff_to_next_activity");
    println!("diff_to_next_activity: {diff_to_next_activity:?}, moment: {moment}");

    Ok(add_expiration_days(&moment))
}
