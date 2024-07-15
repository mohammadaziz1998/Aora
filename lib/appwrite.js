import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from 'react-native-appwrite';

export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.mohamad.aora',
  projectId: '668e883300343364dd25',
  databaseId: '668e8bf00006d5d18274',
  userCollectionId: '668e8c23002eae2bfb2e',
  videoCollectionId: '668e8e61002f5eefb271',
  storageId: '668e9070001db4119f4d',
};

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
  .setProject(appwriteConfig.projectId) // Your project ID
  .setPlatform(appwriteConfig.platform); // Your application ID or bundle ID.

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Register User
export const createUser = async (email, password, userName) => {
  const userId = ID.unique();
  try {
    const newAccount = await account.create(userId, email, password, userName);
    if (!newAccount) throw Error;
    const avatarUrl = avatars.getInitials(userName);

    await signIn(email, password);
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      { accountId: newAccount.$id, email, userName, avatar: avatarUrl }
    );

    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

///
////
/////
export async function signIn(email, password) {
  try {
    // console.log('terminal');
    // const result = await account.deleteSessions();

    const session = await account.createEmailPasswordSession(email, password);
    // console.log(sessiron);
    return session;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const getAllPost = async () => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );
    return posts.documents;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc('$createdAt', Query.limit(7))]
    );
    return posts.documents;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
export const searchPosts = (query) => {
  return async () => {
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.search('title', query)]
      );
      return posts.documents;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };
};
export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal('users', userId)]
    );
    return posts.documents;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');
    return session;
  } catch (error) {
    throw new Error(error);
  }
};
export const getFilePreview = async (fileId, type) => {
  let fileUrl;
  try {
    if (type === 'video') {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === 'image') {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        'top',
        100
      );
    } else {
      throw new Error('invalid file type');
    }

    if (!fileUrl) throw Error;
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
};
export const uploadFile = async (file, type) => {
  if (!file) return;
  const { mimetype, ...rest } = file;
  const asset = { type: mimetype, ...rest };
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );
    const fileUrl = await getFilePreview(uploadedFile.$id, type);
  } catch (error) {
    throw new Error(error);
  }
};

export const createVideo = async (form) => {
  try {
    const { thumbnailUrl, videoUrl } = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video'),
    ]);
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form,
        prompt,
        creator: form.userId,
      }
    );
    return newPost;
  } catch (error) {
    throw new Error(error);
  }
};
