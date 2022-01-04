import * as aws from "aws-sdk"
export interface ConnectionConfigInterface {
    aws: typeof aws
    s3: string
    getStats: boolean
    db: string
    workgroup: string
    formatJson: boolean
    retry: number
    ignoreEmpty: boolean
    encryption: Record<string, string>
    skipResults: boolean
    waitForResults: boolean
    catalog: string
    pagination: string
    extraAthenaClientParams?: aws.Athena.ClientConfiguration
    extraS3ClientParams?: aws.S3.ClientConfiguration
}

export interface QueryResultsInterface<T> {
    Items: T[]
    DataScannedInMB: number
    QueryCostInUSD: number
    EngineExecutionTimeInMillis: number
    S3Location: string
    QueryExecutionId: string
    NextToken: string
    Count: number
    DataScannedInBytes: number
    TotalExecutionTimeInMillis: number
    QueryQueueTimeInMillis: number
    QueryPlanningTimeInMillis: number
    ServiceProcessingTimeInMillis: number
}

export interface QueryObjectInterface {
    sql: string
    db: string
}
export type DirectQueryString = string
export type QueryExecutionId = string

export type OptionalQueryResultsInterface<T> = Partial<QueryResultsInterface<T>> &
    Pick<QueryResultsInterface<T>, "QueryExecutionId">
export type QueryResult<T> = OptionalQueryResultsInterface<T>
export type QueryFunc<T> = (
    query: QueryObjectInterface | DirectQueryString | QueryExecutionId
) => Promise<QueryResult<T>>

export default class AthenaExpress<T> {
    public new: (config: Partial<ConnectionConfigInterface>) => any
    public query: QueryFunc<T>
    constructor(config: Partial<ConnectionConfigInterface>)
}
