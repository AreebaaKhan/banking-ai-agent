# Custom Agent Rules

The user prefers to manually run terminal commands themselves to understand what is happening in their project, rather than having the agent run commands asynchronously. 

When the user needs to execute a command (like starting a server, running a script, installing dependencies, or running git commands):
1. **DO NOT** use the `run_command` tool to execute it for them.
2. Provide the exact command in a markdown code block so they can copy-paste it into their own terminal.
3. Briefly explain what the command does.
