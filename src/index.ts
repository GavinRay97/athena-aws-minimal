import path from "path"
import dotenv from "dotenv"
import AWS from "aws-sdk"
import { default as proxy } from "proxy-agent"

import AthenaExpress from "./athena-express-custom"
import type { ConnectionConfigInterface } from "./athena-express-custom"

// Load environment variables from .env file
dotenv.config({
    path: path.join(__dirname, "../", ".env"),
})

import {
    AWS_DEFAULT_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN,
    AWS_S3_RESULT_BUCKET_ADDRESS,
    AWS_ATHENA_DB_NAME,
    AWS_ATHENA_CATALOG_NAME,
    AWS_ATHENA_OPTION_FORMAT_JSON,
    AWS_ATHENA_OPTION_GET_QUERY_STATS,
    AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS,
    AWS_ATHENA_OPTION_WORKGROUP,
    AWS_ATHENA_OPTION_RETRY_MS,
    AWS_OPTION_HTTP_OPTIONS_PROXY_URL,
} from "./env-config"

const TEST_QUERY = `
 SELECT id FROM albums LIMIT 10;
`

/**
 * ============================
 * Configure AWS
 * ============================
 */

const awsConfig: AWS.ConfigurationOptions = {
    region: AWS_DEFAULT_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    ...(AWS_SESSION_TOKEN && {
        sessionToken: AWS_SESSION_TOKEN,
    }),
    ...(AWS_OPTION_HTTP_OPTIONS_PROXY_URL && {
        httpOptions: {
            agent: proxy(AWS_OPTION_HTTP_OPTIONS_PROXY_URL),
        },
    }),
    logger: {
        log: (args: any) => console.log("[AWS.config Logger]", args),
    },
}
AWS.config.update(awsConfig)
console.log("AWS Config", awsConfig)

const athenaExpressConfig: Partial<ConnectionConfigInterface> = {
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
}

console.log("CONFIGURING ATHENA CLIENT WITH PARAMETERS: ", {
    ...athenaExpressConfig,
    aws: "<IGNORED>",
})

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
