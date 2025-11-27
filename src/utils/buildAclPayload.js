    export default function buildAclPayload(aclState) {
    return {
      readUsers: Array.isArray(aclState.users) ? aclState.users : [],
      writeUsers: Array.isArray(aclState.users) ? aclState.users : [],
      readTeams: Array.isArray(aclState.teams) ? aclState.teams : [],
      writeTeams: Array.isArray(aclState.teams) ? aclState.teams : [],
    };
  }