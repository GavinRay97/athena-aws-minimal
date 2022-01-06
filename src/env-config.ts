export const AWS_DEFAULT_REGION = process.env["AWS_DEFAULT_REGION"] || "us-west-2"
export const AWS_ATHENA_CATALOG_NAME = process.env["AWS_ATHENA_CATALOG_NAME"] || "AwsDataCatalog"
export const AWS_ATHENA_DB_NAME = process.env["AWS_ATHENA_DB_NAME"] || "default"
export const AWS_S3_RESULT_BUCKET_ADDRESS = process.env["AWS_S3_RESULT_BUCKET_ADDRESS"]
export const AWS_ACCESS_KEY_ID = process.env["AWS_ACCESS_KEY_ID"]
export const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"]
export const AWS_SESSION_TOKEN = process.env["AWS_SESSION_TOKEN"]
export const AWS_OPTION_HTTP_OPTIONS_PROXY_URL = process.env["AWS_OPTION_HTTP_OPTIONS_PROXY_URL"]

export const AWS_ATHENA_OPTION_FORMAT_JSON = process.env["AWS_ATHENA_OPTION_FORMAT_JSON"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"])
    : true

export const AWS_ATHENA_OPTION_GET_QUERY_STATS = process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"])
    : true

export const AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS = process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"]
    ? Boolean(process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"])
    : false

export const AWS_ATHENA_OPTION_WORKGROUP = process.env["AWS_ATHENA_OPTION_WORKGROUP"]
    ? process.env["AWS_ATHENA_OPTION_WORKGROUP"]
    : "primary"

export const AWS_ATHENA_OPTION_RETRY_MS = process.env["AWS_ATHENA_OPTION_RETRY_MS"]
    ? Number(process.env["AWS_ATHENA_OPTION_RETRY_MS"])
    : 200
