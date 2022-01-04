import path from "path"
import dotenv from "dotenv"
import AWS, { Athena } from "aws-sdk"
import * as AthenaV3 from "@aws-sdk/client-athena"

import AthenaExpress from "./athena-express-custom"
import type { ConnectionConfigInterface } from "./athena-express-custom"

import {
    GetQueryExecutionCommand,
    GetQueryResultsCommand,
    QueryExecutionState,
    StartQueryExecutionCommand,
} from "@aws-sdk/client-athena"

// Load environment variables from .env file
dotenv.config({
    path: path.join(__dirname, "../", ".env"),
})

const TEST_QUERY = `
    SELECT state FROM lake_table01 LIMIT 10;
`

const extraAthenaClientParams: Athena.ClientConfiguration = {
    endpoint: "changeme",
}

const extraS3ClientParams: AWS.S3.ClientConfiguration = {
    endpoint: "changeme",
}

/**
 * ============================
 * CONFIGURATION
 * ============================
 */

const AWS_DEFAULT_REGION = process.env["AWS_DEFAULT_REGION"] || "us-west-2"
const AWS_ACCESS_KEY_ID = process.env["AWS_ACCESS_KEY_ID"]
const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"]
const AWS_SESSION_TOKEN = process.env["AWS_SESSION_TOKEN"]

const AWS_S3_RESULT_BUCKET_ADDRESS = process.env["AWS_S3_RESULT_BUCKET_ADDRESS"]

const AWS_ATHENA_CATALOG_NAME = process.env["AWS_ATHENA_CATALOG_NAME"] || "AwsDataCatalog"
const AWS_ATHENA_DB_NAME = process.env["AWS_ATHENA_DB_NAME"] || "default"

const AWS_ATHENA_OPTION_FORMAT_JSON = process.env["AWS_ATHENA_OPTION_FORMAT_JSON"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"])
    : true

const AWS_ATHENA_OPTION_GET_QUERY_STATS = process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"])
    : true

const AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS = process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"])
    : false

const AWS_ATHENA_OPTION_WORKGROUP = process.env["AWS_ATHENA_OPTION_WORKGROUP"]
    ? process.env["AWS_ATHENA_OPTION_WORKGROUP"]
    : "primary"

const AWS_ATHENA_OPTION_RETRY_MS = process.env["AWS_ATHENA_OPTION_RETRY_MS"]
    ? Number(process.env["AWS_ATHENA_OPTION_RETRY_MS"])
    : 200

const AWS_ATHENA_OPTION_ENCRYPTION_ENABLED = process.env["AWS_ATHENA_OPTION_ENCRYPTION_ENABLED"]
const AWS_ATHENA_OPTION_ENCRYPTION_TYPE = process.env["AWS_ATHENA_OPTION_ENCRYPTION_TYPE"] ?? "SSE_KMS"
const AWS_ATHENA_OPTION_ENCRYPTION_KEY = process.env["AWS_ATHENA_OPTION_ENCRYPTION_KEY"] ?? "KmsKey"
const AWS_ATHENA_OPTION_ENCRYPTION_VALUE = process.env["AWS_ATHENA_OPTION_ENCRYPTION_VALUE"] ?? ""

AWS.config.update({
    region: AWS_DEFAULT_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    ...(AWS_SESSION_TOKEN && { sessionToken: AWS_SESSION_TOKEN }),
})

const athenaExpressConfig: Partial<ConnectionConfigInterface> = {
    extraS3ClientParams,
    extraAthenaClientParams,
    aws: AWS, // required
    /**
     * The location in Amazon S3 where your query results are stored, such as s3://path/to/query/bucket/.
     * athena-express will create a new bucket for you if you don't provide a value for this param but
     * sometimes that could cause an issue if you had recently deleted a bucket with the same name.
     * (something to do with cache).
     *
     * When that happens, just specify you own bucket name.
     * Alternatively you can also use workgroup.
     */
    s3: AWS_S3_RESULT_BUCKET_ADDRESS, // optional
    /**
     * Athena database name that the SQL queries should be executed in.
     * When a db name is specified in the config, you can execute SQL queries without needing to
     * explicitly mention DB name.
     *
     * e.g.
     * athenaExpress.query("SELECT * FROM movies LIMIT 3")
     *
     * as opposed to
     * athenaExpress.query({sql: "SELECT * FROM movies LIMIT 3", db: "moviedb"});
     */
    db: AWS_ATHENA_DB_NAME, // optional
    /**
     * The catalog to which the query results belong
     */
    catalog: AWS_ATHENA_CATALOG_NAME, // optional
    /**
     * Override as false if you rather get the raw unformatted output from S3.
     */
    formatJson: AWS_ATHENA_OPTION_FORMAT_JSON,
    /**
     * Set getStats: true to capture additional metadata for your query
     */
    getStats: AWS_ATHENA_OPTION_GET_QUERY_STATS,
    /**
   * Ignore fields with empty values from the final JSON response.

   */
    ignoreEmpty: AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS,
    /**
     * The name of the workgroup in which the query is being started.
     * Note: athena-express cannot create workgroups (as it includes a lot of configuration)
     * so you will need to create one beforehand IFF you intend to use a non default workgroup
     */
    workgroup: AWS_ATHENA_OPTION_WORKGROUP,
    /**
     * Wait interval between re-checking if the specific Athena query has finished executing
     */
    retry: AWS_ATHENA_OPTION_RETRY_MS,
    ...(AWS_ATHENA_OPTION_ENCRYPTION_ENABLED && {
        // optional
        /**
         * Encryption configuation example usage:
         * { EncryptionOption: "SSE_KMS", KmsKey: process.env.kmskey }
         */
        encryption: {
            EncryptionOption: AWS_ATHENA_OPTION_ENCRYPTION_TYPE,
            [AWS_ATHENA_OPTION_ENCRYPTION_KEY]: AWS_ATHENA_OPTION_ENCRYPTION_VALUE,
        },
    }),
}

console.log("CONFIGURING ATHENA CLIENT WITH PARAMETERS: ", {
    ...athenaExpressConfig,
    aws: "<IGNORED>",
})

/**
 * ============================
 * AWS Athena V3 Client Test
 * ============================
 */

const athenaV3Client = new AthenaV3.AthenaClient({
    // Unsure of these:
    // tls: true,
    // useFipsEndpoint: true,
    credentials: {
        accessKeyId: process.env["AWS_ACCESS_KEY_ID"] || "",
        secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] || "",
        sessionToken: process.env["AWS_SESSION_TOKEN"] || "",
    },
    logger: console,
})

async function testAthenaV3() {
    try {
        const queryInput: AthenaV3.StartQueryExecutionCommandInput = {
            QueryString: TEST_QUERY,
            ResultConfiguration: {
                OutputLocation: AWS_S3_RESULT_BUCKET_ADDRESS,
            },
            QueryExecutionContext: {
                Catalog: AWS_ATHENA_CATALOG_NAME,
            },
        }

        if (AWS_ATHENA_DB_NAME) {
            queryInput.QueryExecutionContext!.Database = AWS_ATHENA_DB_NAME
        }

        if (AWS_ATHENA_OPTION_WORKGROUP) {
            queryInput.WorkGroup = AWS_ATHENA_OPTION_WORKGROUP
        }

        if (AWS_ATHENA_OPTION_ENCRYPTION_ENABLED) {
            queryInput.ResultConfiguration!.EncryptionConfiguration = {
                EncryptionOption: AWS_ATHENA_OPTION_ENCRYPTION_TYPE,
                [AWS_ATHENA_OPTION_ENCRYPTION_KEY]: AWS_ATHENA_OPTION_ENCRYPTION_VALUE,
            }
        }

        const response = await athenaV3Client.send(new StartQueryExecutionCommand(queryInput))
        console.log("testAthenaV3 [StartQueryExecutionCommand]", response)

        const QUERY_CHECK_INTERVAL_MS = 1000
        const checkQueryInterval = setInterval(async () => {
            const queryExecutionState = await athenaV3Client.send(
                new GetQueryExecutionCommand({ QueryExecutionId: response.QueryExecutionId })
            )

            const state = queryExecutionState?.QueryExecution?.Status?.State
            if (!state) throw new Error("No state in queryExecutionState")

            console.log("GetQueryExecutionCommand State:", state)
            switch (state) {
                case QueryExecutionState.FAILED: {
                    console.log("Query failed")
                    console.dir(queryExecutionState, { depth: Infinity })
                    clearInterval(checkQueryInterval)
                    break
                }
                case QueryExecutionState.CANCELLED: {
                    console.log("Query cancelled")
                    clearInterval(checkQueryInterval)
                    break
                }
                case QueryExecutionState.QUEUED: {
                    console.log("Query queued")
                    break
                }
                case QueryExecutionState.RUNNING: {
                    console.log("Query running")
                    break
                }
                case QueryExecutionState.SUCCEEDED: {
                    console.log("Query succeeded")

                    const response2 = await athenaV3Client.send(
                        new GetQueryResultsCommand({
                            QueryExecutionId: response.QueryExecutionId,
                            MaxResults: 10,
                        })
                    )

                    console.log("testAthenaV3 [GetQueryResults]")
                    console.dir(response2, { depth: Infinity })

                    clearInterval(checkQueryInterval)
                    break
                }
            }
        }, QUERY_CHECK_INTERVAL_MS)
    } catch (e) {
        console.log("Error in testAthenaV3()", e)
    }
}

testAthenaV3()

/**
 * ============================
 * MAIN
 * ============================
 */

const athena = new AthenaExpress(athenaExpressConfig)

async function testAthena() {
    try {
        const queryResults = await athena.query(TEST_QUERY)
        console.log(queryResults)
    } catch (e) {
        console.log("Error in testAthena()", e)
    }
}

async function main() {
    await testAthena()
}

main().catch((e) => console.log("Error in main()", e))
