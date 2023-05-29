import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const tableName = process.env.table;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const ddbClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const marshallOptions = {
  convertEmptyValues: true,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true,
};

export async function addPicture(id, imageName, caption, timestamp) {
  try {
    const params = {
      TableName: tableName,
      Item: marshall(
        {
          id,
          imageName,
          caption,
          timestamp,
        },
        marshallOptions
      ),
    };
    const { $metadata } = await ddbClient.send(new PutItemCommand(params));
    return $metadata;
  } catch (e) {
    throw new Error(e);
  }
}

export async function getPosts() {
  try {
    const params = {
      TableName: tableName,
    };
    const { Items } = await ddbClient.send(new ScanCommand(params));
    const items = Items.map((item) => {
      return unmarshall(item);
    });
    return items;
  } catch (e) {
    throw new Error(e);
  }
}
// const deleteContactId = async (contactId) => {
//     try {
//         const params = {
//             TableName: process.env.contactIdTable,
//             Key: marshall({
//                 contactId
//             }, marshallOptions)

//         };
//         const { $metadata } = await ddbClient.send(new DeleteItemCommand(params));
//         console.log(`Deleted contact id `, contactId);
//         return $metadata.httpStatusCode;
//     }
//     catch (e) {
//         throw new Error(e);
//     }
// };
