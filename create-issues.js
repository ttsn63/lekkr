const fs = require('fs');
const { Octokit } = require('@octokit/rest');

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: 'YOUR_GITHUB_TOKEN', // Replace with your GitHub token
});

// Function to read TODO.md and create issues
async function createIssuesFromTodo() {
  fs.readFile('TODO.md', 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading TODO.md:', err);
      return;
    }

    const todos = data.split('\n').filter(todo => todo.trim() !== '');
    
    for (const todo of todos) {
      const issueTitle = todo.trim();
      try {
        const response = await octokit.issues.create({
          owner: 'ttsn63',
          repo: 'lekkr',
          title: issueTitle,
        });
        console.log(`Issue created: ${response.data.html_url}`);
      } catch (error) {
        console.error('Error creating issue:', error);
      }
    }
  });
}

// Execute the function
createIssuesFromTodo();
