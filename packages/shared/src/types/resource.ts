type UploadEvent = 'image';

interface IResource {
    path: string;
}

type IResourceUpdateData = IResource;
type IResourceDeleteData = Pick<IResource, 'path'>;

export type {
    UploadEvent,
    IResource,
    IResourceUpdateData,
    IResourceDeleteData,
};
