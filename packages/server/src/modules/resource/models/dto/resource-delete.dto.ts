import { IResource, IResourceDTO } from '#shared/types/interfaces';
import { ResourceDTO } from '#/modules/base';
import { DTO } from '#/utils';

//--- ResourceDeleteDTO -----------
class ResourceDeleteDTO
    extends DTO.resource(ResourceDTO)
    implements IResourceDTO<IResource> {}

export { ResourceDeleteDTO };
