import { Req } from '#/types/interfaces';

enum UploadEvent {
    Images = 'images'
}

interface IResource {
    path: string;
}

type IResourceDTO<T extends object> = Req<'resource', T>;

export { UploadEvent, IResource, IResourceDTO };
