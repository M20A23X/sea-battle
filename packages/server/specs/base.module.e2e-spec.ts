import { v4 } from 'uuid';
import { INestApplication, ValidationError } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ISpecsConfig } from '#shared/specs/types';
import { SpecsConfig } from '#shared/specs/static';
import { Format } from '#shared/static';

import { init } from './utils/init';

import {
    CredentialsDTO,
    CurrentPasswordDTO,
    EmailDTO,
    ImgPathDTO,
    PasswordDTO,
    PasswordSetDTO,
    RangeDTO,
    TokenDTO,
    UsernameDTO,
    UuidDTO
} from '#/modules/base';
import { LoggerService } from '#/services';

describe.skip('Base module', () => {
    let app: INestApplication;
    // --- Logger -------------------------------------------------------------
    let logger: LoggerService;
    // --- Configs --------------------
    let specs: ISpecsConfig = SpecsConfig.specs;

    beforeAll(async () => {
        [app, specs, logger] = await init();
        // --- Format --------------------
        logger.debug(JSON.stringify(Format));
    }, SpecsConfig.specs.getHookTimeoutMs());

    describe('DTO', function () {
        describe('CredentialsDTO', function () {
            it(
                // eslint-disable-next-line sonarjs/no-duplicate-string
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: PasswordSetDTO = {
                        // eslint-disable-next-line sonarjs/no-duplicate-string
                        password: 'Us23mmsv200#',
                        passwordConfirm: 'Us23mmsv200#'
                    };
                    const dto: PasswordSetDTO = plainToInstance(
                        PasswordSetDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                // eslint-disable-next-line sonarjs/no-duplicate-string
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: CredentialsDTO = {
                        usernameOrEmail: '$%#asf',
                        password: '123af3'
                    };
                    const dto: CredentialsDTO = plainToInstance(
                        CredentialsDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'password' + Format.password.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('CurrentPasswordDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: CurrentPasswordDTO = {
                        currentPassword: 'Us23mmsv200#'
                    };
                    const dto: CurrentPasswordDTO = plainToInstance(
                        CurrentPasswordDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: CurrentPasswordDTO = {
                        currentPassword: '124'
                    };
                    const dto: CurrentPasswordDTO = plainToInstance(
                        CurrentPasswordDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'current password' + Format.password.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('EmailDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: EmailDTO = { email: 'sample@gmail.com' };
                    const dto: EmailDTO = plainToInstance(EmailDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: EmailDTO = { email: 'hdfshsrt' };
                    const dto: EmailDTO = plainToInstance(EmailDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'email' + Format.email.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('ImgPathDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: ImgPathDTO = {
                        imgPath: 'D:/sample/dir/path/file.ext'
                    };
                    const dto: ImgPathDTO = plainToInstance(
                        ImgPathDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: ImgPathDTO = {
                        imgPath: 'D:/sample/dir/path/#$file.ext'
                    };
                    const dto: ImgPathDTO = plainToInstance(
                        ImgPathDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'image path' + Format.path.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('PasswordDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: PasswordDTO = { password: 'Us23mmsv200#' };
                    const dto: PasswordDTO = plainToInstance(
                        PasswordDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: PasswordDTO = { password: '123' };
                    const dto: PasswordDTO = plainToInstance(
                        PasswordDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'password' + Format.password.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('PasswordSetDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: PasswordSetDTO = {
                        password: 'Us23mmsv200#',
                        passwordConfirm: 'Us23mmsv200#'
                    };
                    const dto: PasswordSetDTO = plainToInstance(
                        PasswordSetDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with isNotEmpty error',
                async () => {
                    const dtoPlain: PasswordSetDTO = {
                        password: '12421',
                        passwordConfirm: ''
                    };
                    const dto: PasswordSetDTO = plainToInstance(
                        PasswordSetDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.isNotEmpty).toEqual(
                        'password confirm must not be empty'
                    );
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: PasswordSetDTO = {
                        password: '12421',
                        passwordConfirm: '12421'
                    };
                    const dto: PasswordSetDTO = plainToInstance(
                        PasswordSetDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'password' + Format.password.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('RangeDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: RangeDTO = { startId: 1, endId: 1000 };
                    const dto: RangeDTO = plainToInstance(RangeDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with isBiggerThan error',
                async () => {
                    const dtoPlain: RangeDTO = { startId: 100, endId: 50 };
                    const dto: RangeDTO = plainToInstance(RangeDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.isBiggerThan).toEqual(
                        'end must be grater than start'
                    );
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with isInt error',
                async () => {
                    const dtoPlain = { start: '100', end: '50' };
                    const dto: RangeDTO = plainToInstance(RangeDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.isInt).toEqual(
                        'start must be an integer number'
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('TokenDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: TokenDTO = { token: 'a9guher9rh58g985' };
                    const dto: TokenDTO = plainToInstance(TokenDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with isNotEmpty error',
                async () => {
                    const dtoPlain: TokenDTO = { token: '' };
                    const dto: TokenDTO = plainToInstance(TokenDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.isNotEmpty).toEqual(
                        'token must not be empty'
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('UsernameDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: UsernameDTO = {
                        username: 'smapleUsernmae'
                    };
                    const dto: UsernameDTO = plainToInstance(
                        UsernameDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: UsernameDTO = {
                        username: '#4378HFUouhfd)('
                    };
                    const dto: UsernameDTO = plainToInstance(
                        UsernameDTO,
                        dtoPlain
                    );

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.matches).toEqual(
                        'username' + Format.username.errorMessage
                    );
                },
                specs.getHookTimeoutMs()
            );
        });

        describe('UuidDTO', function () {
            it(
                'Should validate DTO without errors',
                async () => {
                    const dtoPlain: UuidDTO = { uuid: v4() };
                    const dto: UuidDTO = plainToInstance(UuidDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors).toEqual([]);
                },
                specs.getHookTimeoutMs()
            );

            it(
                'Should validate DTO with matches error',
                async () => {
                    const dtoPlain: UuidDTO = { uuid: '#4378HFUouhfd)(' };
                    const dto: UuidDTO = plainToInstance(UuidDTO, dtoPlain);

                    const errors: ValidationError[] = await validate(dto);
                    expect(errors?.[0]?.constraints?.isUuid).toEqual(
                        'uuid must be a UUID'
                    );
                },
                specs.getHookTimeoutMs()
            );
        });
    });
});
