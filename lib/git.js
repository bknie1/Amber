import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Returns { commit, branch } for the given directory, or nulls outside a repo.
export async function gitInfo(cwd) {
  try {
    const [commit, branch] = await Promise.all([
      run("git", ["rev-parse", "--short", "HEAD"], { cwd }),
      run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd }),
    ]);
    return { commit: commit.stdout.trim(), branch: branch.stdout.trim() };
  } catch {
    return { commit: null, branch: null };
  }
}
