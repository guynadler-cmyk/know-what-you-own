import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export class GitHubService {
  async createRepository(name: string, description: string, isPrivate: boolean = false) {
    const octokit = await getUncachableGitHubClient();
    
    try {
      const response = await octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: false
      });
      
      return {
        url: response.data.html_url,
        cloneUrl: response.data.clone_url,
        owner: response.data.owner.login,
        name: response.data.name
      };
    } catch (error: any) {
      if (error.status === 422) {
        // Repository already exists, get it instead
        const user = await octokit.users.getAuthenticated();
        const repo = await octokit.repos.get({
          owner: user.data.login,
          repo: name
        });
        
        return {
          url: repo.data.html_url,
          cloneUrl: repo.data.clone_url,
          owner: repo.data.owner.login,
          name: repo.data.name,
          exists: true
        };
      }
      throw error;
    }
  }

  async getAuthenticatedUser() {
    const octokit = await getUncachableGitHubClient();
    const response = await octokit.users.getAuthenticated();
    return response.data;
  }
}

export const githubService = new GitHubService();
