import protectSensitiveFiles from './protect-sensitive-files.mjs';
import blockSecretsInWrites from './block-secrets-in-writes.mjs';
import redactPromptSecrets from './redact-prompt-secrets.mjs';
import guardDangerousCommands from './guard-dangerous-commands.mjs';
import protectPaths from './protect-paths.mjs';
import requireSpec from './require-spec.mjs';
import postEditQuality from './post-edit-quality.mjs';
import warnSecretOutput from './warn-secret-output.mjs';
import sessionContext from './session-context.mjs';
import verifyOnStop from './verify-on-stop.mjs';
import auditLog from './audit-log.mjs';
import commitCheckpoint from './commit-checkpoint.mjs';
import protectBranches from './protect-branches.mjs';
import cleanCommitMessage from './clean-commit-message.mjs';

export const CHECKS = [protectSensitiveFiles, blockSecretsInWrites, redactPromptSecrets, guardDangerousCommands, protectPaths, requireSpec, postEditQuality, warnSecretOutput, sessionContext, verifyOnStop, auditLog, commitCheckpoint, protectBranches, cleanCommitMessage];
