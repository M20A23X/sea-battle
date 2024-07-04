import { Req } from '#/types/requestResponse';

enum UploadEvent {
    Image = 'image'
}

interface Resource {
    path: string;
}

type ResourceReqDTO<V> = Req<`resource`, V>;

export { UploadEvent, Resource, ResourceReqDTO };
