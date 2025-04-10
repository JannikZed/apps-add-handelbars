import { EncryptedMetadataManager, MetadataEntry } from "@saleor/app-sdk/settings-manager";
import { Client } from "urql";

import {
  DeleteAppMetadataDocument,
  FetchAppDetailsDocument,
  FetchAppDetailsQuery,
  UpdateAppMetadataDocument,
} from "../../generated/graphql";

export async function fetchAllMetadata(client: Client): Promise<MetadataEntry[]> {
  const { error, data } = await client
    .query<FetchAppDetailsQuery>(FetchAppDetailsDocument, {})
    .toPromise();

  if (error) {
    return [];
  }

  return data?.app?.privateMetadata.map((md) => ({ key: md.key, value: md.value })) || [];
}

export async function mutateMetadata(client: Client, metadata: MetadataEntry[]) {
  // to update the metadata, ID is required
  const { error: idQueryError, data: idQueryData } = await client
    .query(FetchAppDetailsDocument, {})
    .toPromise();

  if (idQueryError) {
    throw new Error(
      "Could not fetch the app id. Please check if auth data for the client are valid.",
    );
  }

  const appId = idQueryData?.app?.id;

  if (!appId) {
    throw new Error("Could not fetch the app ID");
  }

  const { error: mutationError, data: mutationData } = await client
    .mutation(UpdateAppMetadataDocument, {
      id: appId,
      input: metadata,
    })
    .toPromise();

  if (mutationError) {
    throw new Error(`Mutation error: ${mutationError.message}`);
  }

  return (
    mutationData?.updatePrivateMetadata?.item?.privateMetadata.map((md) => ({
      key: md.key,
      value: md.value,
    })) || []
  );
}

async function deleteMetadata(
  client: Pick<Client, "mutation" | "query">,
  keys: string[],
): Promise<void> {
  // to update the metadata, ID is required
  const { error: idQueryError, data: idQueryData } = await client
    .query(FetchAppDetailsDocument, {})
    .toPromise();

  if (idQueryError) {
    throw new Error(
      "Could not fetch the app id. Please check if auth data for the client are valid.",
    );
  }

  const appId = idQueryData?.app?.id;

  if (!appId) {
    throw new Error("Could not fetch the app ID");
  }

  const { error } = await client
    .mutation(DeleteAppMetadataDocument, {
      id: appId,
      keys,
    })
    .toPromise();

  if (error) {
    throw new Error("Error during metadata deletion", {
      cause: error,
    });
  }
}

export const createSettingsManager = (client: Client) => {
  /*
   * EncryptedMetadataManager gives you interface to manipulate metadata and cache values in memory.
   * We recommend it for production, because all values are encrypted.
   * If your use case require plain text values, you can use MetadataManager.
   */
  return new EncryptedMetadataManager({
    // Secret key should be randomly created for production and set as environment variable
    encryptionKey: process.env.SECRET_KEY!,
    fetchMetadata: () => fetchAllMetadata(client),
    mutateMetadata: (metadata) => mutateMetadata(client, metadata),
    deleteMetadata: (keys) => deleteMetadata(client, keys),
  });
};
