import { PermissionResource } from '@prisma/client';

type ResourceData = {
  type: PermissionResource;
  name?: string;
};

type ParsePartsResult = {
  primaryResource: string;
  secondaryResource?: string;
  primaryResourceName?: string;
  secondaryResourceName?: string;
};

export default class ResourceURLParser {
  private static parseParts(url: string): ParsePartsResult {
    const parts: string[] = url.split('/').map(part => {
      const queryParamStart = part.indexOf('?');
      if (queryParamStart === -1) return part;
      else return part.substring(0, queryParamStart);
    });
    parts.splice(0, 3); // Remove the /api/v2 part

    const primaryResource = parts[0];
    let primaryResourceName: string;
    let secondaryResource: string;
    let secondaryResourceName: string;

    // No name for the primary resource
    if (parts.length === 1) return { primaryResource };

    primaryResourceName = parts[1];

    // Only a primary resource with a name
    if (parts.length === 2) return { primaryResource, primaryResourceName };

    // It has a sub-resource
    secondaryResource = parts[2];

    // Secondary resource without a name
    if (parts.length === 3)
      return { primaryResource, primaryResourceName, secondaryResource };

    secondaryResourceName = parts[3];

    return {
      primaryResource,
      primaryResourceName,
      secondaryResource,
      secondaryResourceName,
    };
  }

  private static getResourceFromResourcePathName(
    resourcePathName: string,
  ): PermissionResource {
    switch (resourcePathName) {
      case 'users':
        return 'USER';
      case 'permissions':
        return 'PERMISSION';
      case 'roles':
        return 'ROLE';
      case 'faculties':
        return 'FACULTY';
      case 'years':
        return 'YEAR';
      case 'modules':
        return 'MODULE';
      case 'subjects':
        return 'SUBJECT';
      case 'lectures':
        return 'LECTURE';
      case 'links':
        return 'LINK';
      case 'quizzes':
        return 'QUIZ';
      case 'questions':
        return 'QUESTION';
      case 'devices':
        return 'DEVICE';
      case 'notifications':
        return 'NOTIFICATION';
      case 'topics':
        return 'TOPIC';
      case 'answers':
        return 'QUESTION_ATTEMPT';
      case 'quiz-attempts':
      case 'submit':
        return 'QUIZ_ATTEMPT';

      default:
        // Throw an error for unknown resource types
        throw new Error(`Unknown resource type: ${resourcePathName}`);
    }
  }

  static getResourceInfoFromUrl(url: string): ResourceData {
    const {
      primaryResource,
      primaryResourceName,
      secondaryResource,
      secondaryResourceName,
    } = ResourceURLParser.parseParts(url);

    let resource: PermissionResource;
    let name: string | undefined;

    if (secondaryResource) {
      resource =
        ResourceURLParser.getResourceFromResourcePathName(secondaryResource);

      if (secondaryResourceName) name = secondaryResourceName;
    } else {
      resource =
        ResourceURLParser.getResourceFromResourcePathName(primaryResource);

      if (primaryResourceName) name = primaryResourceName;
    }

    return { type: resource, name };
  }
}
