const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

function parseTodoFile(todoFilePath) {
    const content = fs.readFileSync(todoFilePath, 'utf-8');
    const tasks = content.split('\n').filter(line => line.startsWith('-') && !line.includes('[x]'));
    return tasks.map(task => task.replace(/^-\s+/, ''));
}

function groupTasksByWeek(tasks) {
    const weeks = {};
    tasks.forEach(task => {
        const week = getWeek(task);
        if (!weeks[week]) {
            weeks[week] = [];
        }
        weeks[week].push(task);
    });
    return weeks;
}

function getWeek(task) {
    const taskDateMatch = task.match(/\d{4}-\d{2}-\d{2}/);
    return taskDateMatch ? new Date(taskDateMatch[0]).toISOString().slice(0, 10) : 'unknown';
}

async function createIssues(weeks) {
    for (const week in weeks) {
        const issues = weeks[week];
        const response = await octokit.issues.create({
            owner: 'ttsn63',
            repo: 'lekkr',
            title: `Tasks for week of ${week}`,
            body: issues.join('\n'),
            labels: [week],
        });
        console.log(`Created issue: ${response.data.html_url}`);
    }
}

const todoFilePath = path.join(__dirname, 'TODO.md');
const tasks = parseTodoFile(todoFilePath);
const groupedTasks = groupTasksByWeek(tasks);
createIssues(groupedTasks);