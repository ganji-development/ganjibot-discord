import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

export enum AccessLevel {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    VIEWER = 'VIEWER'
}

export const GET_MY_ACCESS_LEVEL = gql`
    query GetMyAccessLevel($guildId: ID!) {
        guild(id: $guildId) {
            id
            myAccessLevel
        }
    }
`;

interface GetMyAccessLevelResponse {
    guild: {
        id: string;
        myAccessLevel: AccessLevel | null;
    } | null;
}

export function useGuildAccess(guildId: string) {
    const { data, loading, error } = useQuery<GetMyAccessLevelResponse>(GET_MY_ACCESS_LEVEL, {
        variables: { guildId },
        skip: !guildId
    });

    const accessLevel = data?.guild?.myAccessLevel as AccessLevel | undefined;

    return {
        accessLevel,
        loading,
        error,
        can: {
            view: true, // Everyone with access can view
            moderate: accessLevel === AccessLevel.OWNER || accessLevel === AccessLevel.ADMIN || accessLevel === AccessLevel.MODERATOR,
            configure: accessLevel === AccessLevel.OWNER || accessLevel === AccessLevel.ADMIN,
            destroy: accessLevel === AccessLevel.OWNER,
            manageAccess: accessLevel === AccessLevel.OWNER
        },
        isOwner: accessLevel === AccessLevel.OWNER,
        isAdmin: accessLevel === AccessLevel.ADMIN,
        isModerator: accessLevel === AccessLevel.MODERATOR,
        isViewer: accessLevel === AccessLevel.VIEWER
    };
}
