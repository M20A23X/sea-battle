import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions
} from 'class-validator';

export function IsBiggerThanOrEqual(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isBiggerThan',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[
                        relatedPropertyName
                    ];
                    return (
                        typeof value === 'number' &&
                        typeof relatedValue === 'number' &&
                        value >= relatedValue
                    );
                }
            }
        });
    };
}
