/* tslint:disable */
/* eslint-disable */
/**
 * This file is generated by core-types-suretype on behalf of typeconv, DO NOT EDIT.
 * For more information, see:
 *  - {@link https://github.com/grantila/core-types-suretype}
 *  - {@link https://github.com/grantila/typeconv}
 */

import { suretype, v, compile, annotate } from 'suretype';

/** The validation schema for a Date */
export const schemaDate = suretype({
    name: "Date"
}, v.unknown());

export type Date = unknown;

/**
 * ## Validate that a variable is a Date
 *
 * @returns ValidationResult
 */
export const validateDate = compile(schemaDate);

/**
 * ## Ensure a variable is a Date
 *
 * This call will throw a ValidationError if the variable isn't a Date.
 *
 * If the variable **is** a Date, the returned variable will be of that type.
 */
export const ensureDate = compile<typeof schemaDate, Date>(schemaDate, { ensure: true });

/**
 * ## Validates that a variable is a Date
 *
 * @returns boolean
 */
export const isDate = compile(schemaDate, { simple: true });

/** The validation schema for a Repository */
export const schemaRepository = suretype({
    name: "Repository",
    title: "Repository"
}, v.object({
    spec: annotate({
        title: "Repository.spec"
    }, v.object({
        owner: annotate({
            title: "Repository.spec.owner",
            examples: ["\"hasundue\""],
            description: "The owner of the repository"
        }, v.string().required()),
        repo: annotate({
            title: "Repository.spec.repo",
            examples: ["\"flash\""],
            description: "The name of the repository"
        }, v.string().required())
    }).required()),
    body: annotate({
        title: "Repository.body"
    }, v.object({
        tags: annotate({
            title: "Repository.body.tags",
            examples: ["[\"typescript\", \"deno\"]"],
            description: "The tags to describe the repository"
        }, v.array(annotate({
            title: "Repository.body.tags.[]"
        }, v.string())).required())
    }).required()),
    meta: annotate({
        title: "Repository.meta"
    }, v.object({
        created_at: annotate({
            title: "Repository.meta.created_at"
        }, schemaDate),
        updated_at: annotate({
            title: "Repository.meta.updated_at"
        }, schemaDate)
    }).required()),
    query: annotate({
        title: "Repository.query"
    }, v.object({
        since: annotate({
            title: "Repository.query.since"
        }, schemaDate),
        until: annotate({
            title: "Repository.query.until"
        }, schemaDate)
    }).required())
}));

export interface Repository {
    spec: {
        /**
         * The owner of the repository
         *
         * @example
         *     "hasundue"
         */
        owner: string;
        /**
         * The name of the repository
         *
         * @example
         *     "flash"
         */
        repo: string;
    };
    body: {
        /**
         * The tags to describe the repository
         *
         * @example
         *     ["typescript", "deno"]
         */
        tags: string[];
    };
    meta: {
        created_at: Date;
        updated_at: Date;
    };
    query: {
        since?: Date;
        until?: Date;
    };
}

/**
 * ## Validate that a variable is a Repository
 *
 * @returns ValidationResult
 */
export const validateRepository = compile(schemaRepository);

/**
 * ## Ensure a variable is a Repository
 *
 * This call will throw a ValidationError if the variable isn't a Repository.
 *
 * If the variable **is** a Repository, the returned variable will be of that type.
 */
export const ensureRepository = compile<typeof schemaRepository, Repository>(schemaRepository, { ensure: true });

/**
 * ## Validates that a variable is a Repository
 *
 * @returns boolean
 */
export const isRepository = compile(schemaRepository, { simple: true });
