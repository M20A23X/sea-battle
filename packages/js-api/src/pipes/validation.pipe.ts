import {
    ArgumentMetadata,
    BadRequestException,
    HttpException,
    ValidationPipe as ValidationPipeBase
} from '@nestjs/common';

class ValidationPipe extends ValidationPipeBase {
    public async transform(value, metadata: ArgumentMetadata): Promise<any> {
        try {
            return await super.transform(value, metadata);
        } catch (error: unknown) {
            if (error instanceof HttpException) {
                const res: string | object = error.getResponse();
                const message: string = res?.['message']?.[0]?.split('.').pop();
                throw new BadRequestException(message);
            }
            throw error;
        }
    }
}

export { ValidationPipe };
