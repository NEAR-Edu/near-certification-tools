# Batch issuing

This file describes the process of issuing certificates in batches.

## 1. Creating a new batch

The first step in running a batch is creating it. We first create a new row in the Airtable _certificate-batches_ table which will autopopulate the _Batch ID_ field and the nft-icon field. The other fields stay blank for now.

## 2. Adding submissions to the batch

The next step is to add submissions to be issued a certificate to the batch. We do this by clicking on the _nc-submissions_ field and pressing the **_+_** (Add) button which will open a pop up to select submissions from. Now we select all the submissions we want to be included in this batch.

## 3. Configuring the Make scenario

The following step is to tell the Make scenario which batch to pull from. This is done by configuring the first module of the scenario to house the value of our new batch's _Batch id_ field.

## 4. Running the Make scenario

The final step is to save the scenario and run it once to issue the certificates in our new batch.
