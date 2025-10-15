import { githubService } from '../server/services/github';
import { execSync } from 'child_process';
import * as fs from 'fs';

async function pushToGitHub() {
  try {
    console.log('🔍 Checking GitHub authentication...');
    const user = await githubService.getAuthenticatedUser();
    console.log(`✅ Authenticated as: ${user.login}`);

    const repoName = 'know-what-you-own';
    const repoDescription = 'A web app that helps investors understand businesses by analyzing SEC 10-K filings using AI';

    console.log('\n📦 Creating GitHub repository...');
    const repo = await githubService.createRepository(repoName, repoDescription, false);
    
    if (repo.exists) {
      console.log(`ℹ️  Repository already exists: ${repo.url}`);
    } else {
      console.log(`✅ Repository created: ${repo.url}`);
    }

    // Initialize git if needed
    if (!fs.existsSync('.git')) {
      console.log('\n🔧 Initializing git repository...');
      execSync('git init', { stdio: 'inherit' });
      execSync('git branch -M main', { stdio: 'inherit' });
    }

    // Add all files
    console.log('\n📝 Adding files to git...');
    execSync('git add .', { stdio: 'inherit' });

    // Check if there are changes to commit
    try {
      execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
      console.log('ℹ️  No changes to commit');
    } catch {
      // There are changes, commit them
      console.log('\n💾 Committing changes...');
      execSync('git commit -m "Initial commit: Know What You Own - SEC 10-K Analysis App"', { stdio: 'inherit' });
    }

    // Add remote if not exists
    try {
      execSync('git remote get-url origin', { stdio: 'pipe' });
      console.log('\nℹ️  Remote origin already exists, updating...');
      execSync(`git remote set-url origin ${repo.cloneUrl}`, { stdio: 'inherit' });
    } catch {
      console.log('\n🔗 Adding remote origin...');
      execSync(`git remote add origin ${repo.cloneUrl}`, { stdio: 'inherit' });
    }

    // Push to GitHub
    console.log('\n🚀 Pushing to GitHub...');
    execSync('git push -u origin main --force', { stdio: 'inherit' });

    console.log('\n✨ Success! Your code is now on GitHub:');
    console.log(`   ${repo.url}`);
    
    return repo.url;
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

pushToGitHub();
