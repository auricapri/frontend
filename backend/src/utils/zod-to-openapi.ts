import { z } from 'zod';

/**
 * Converte um schema Zod em um schema OpenAPI
 */
export function zodToOpenAPI(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodString) {
    const def: Record<string, unknown> = { type: 'string' };
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if (check.kind === 'min') {
          def.minLength = check.value;
        } else if (check.kind === 'max') {
          def.maxLength = check.value;
        } else if (check.kind === 'email') {
          def.format = 'email';
        } else if (check.kind === 'uuid') {
          def.format = 'uuid';
        } else if (check.kind === 'url') {
          def.format = 'uri';
        }
      }
    }
    return def;
  }

  if (schema instanceof z.ZodNumber) {
    const def: Record<string, unknown> = { type: 'number' };
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if (check.kind === 'min') {
          def.minimum = check.value;
        } else if (check.kind === 'max') {
          def.maximum = check.value;
        } else if (check.kind === 'int') {
          def.type = 'integer';
        }
      }
    }
    return def;
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  if (schema instanceof z.ZodDate) {
    return { type: 'string', format: 'date-time' };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToOpenAPI(schema._def.type),
    };
  }

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(schema.shape)) {
      const zodValue = value as z.ZodTypeAny;
      properties[key] = zodToOpenAPI(zodValue);

      // Verificar se o campo é opcional
      if (!(zodValue instanceof z.ZodOptional) && !(zodValue instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    const def: Record<string, unknown> = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      def.required = required;
    }

    return def;
  }

  if (schema instanceof z.ZodOptional) {
    return zodToOpenAPI(schema._def.innerType);
  }

  if (schema instanceof z.ZodDefault) {
    const inner = zodToOpenAPI(schema._def.innerType);
    if (typeof schema._def.defaultValue() !== 'undefined') {
      inner.default = schema._def.defaultValue();
    }
    return inner;
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema._def.values,
    };
  }

  if (schema instanceof z.ZodUnion) {
    // Para union, retornamos o primeiro tipo (pode ser melhorado)
    return zodToOpenAPI(schema._def.options[0]);
  }

  if (schema instanceof z.ZodLiteral) {
    return {
      type: typeof schema._def.value,
      enum: [schema._def.value],
    };
  }

  // Fallback para tipos não suportados
  return { type: 'string', description: 'Any value' };
}

/**
 * Gera um schema OpenAPI a partir de um objeto Zod
 */
export function generateOpenAPISchema(schema: z.ZodObject<any>): Record<string, unknown> {
  return zodToOpenAPI(schema) as Record<string, unknown>;
}
