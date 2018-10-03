import { exec } from 'child_process';
import { format } from 'util';
import { dirname, basename } from 'path';


const singleSlash = /\//g;

export interface SmbConfig {
  address: string;
  username: string;
  password: string | undefined;
  domain: string;
  path?: string;
  others?: string;
}

const wrap = (str: string) => `'${str}'`;

export class SambaClient {
  private configSamba: SmbConfig;

  constructor (config: SmbConfig) {
    this.configSamba = {
      address: config.address,
      username: wrap(config.username || 'guest'),
      password: config.password ? wrap(config.password) : undefined,
      domain: config.domain,
      path: config.path,
      others: config.others,
    };
  }

  private async runCommand(cmd: string, path: string, destination: string): Promise<void> {
    const workingDir   = dirname(path);
    const fileName     = basename(path).replace(singleSlash, '\\');
    const cmdArgs      = format('%s %s', fileName, destination);
    await this.execute(cmd, cmdArgs, workingDir);
  }

  private async execute(cmd: string, cmdArgs: string, workingDir: string): Promise<boolean> {
    const fullCmd = wrap(format('%s %s', cmd, cmdArgs));
    const command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');
    const options = { cwd : workingDir };
    await exec(command, options, function(err, stdout, stderr) {
      const allOutput = (stdout + stderr);
      if (err !== null) {
        err.message += allOutput;
        return false;
      } else {
        console.log(stdout);
        return true;
      }
    });
    return true;
  }

  private getSmbClientArgs(fullCmd: string) {
    let args = ['-U', this.configSamba.username];
    if (!this.configSamba.password) {
      args.push('-N');
    }
    args.push('-c', fullCmd, this.configSamba.address);
    if (this.configSamba.password) {
      args.push(this.configSamba.password);
    }
    if (this.configSamba.domain) {
      args.push('-W');
      args.push(this.configSamba.domain);
    }
    if (this.configSamba.path) {
      args.push('-D');
      args.push(this.configSamba.path);
    }
    if (this.configSamba.others) {
      args.push(this.configSamba.others);
    }
    return args;
  }

  public async getFile(path: string, destination: string): Promise<void> {
    await this.runCommand('get', path, destination);
  }

  public async sendFile(path: string, destination: string): Promise<void> {
    await this.runCommand('put', path, destination.replace(singleSlash, '\\'));
  }

  public async deleteFile(fileName: string): Promise<void> {
    await this.execute('del', fileName, '');
  }

  public async listFiles(fileNamePrefix: string, fileNameSuffix: string) {
    const cmdArgs = format('%s*%s', fileNamePrefix, fileNameSuffix);
    await this.execute('dir', cmdArgs, '');
  }

  public async mkdir(remotePath: string): Promise<void> {
    await this.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname);
  }

  public async dir(remotePath: string) {
    await this.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname);
  }
  public async fileExists(remotePath: string) {
    await this.dir(remotePath);
  }

  public async getAllShares(): Promise<void> {
    await exec('smbtree -U guest -N', {}, function(err, stdout, stderr) {
      const allOutput = (stdout + stderr);
      if (err !== null) {
        err.message += allOutput;
        return false;
      }
      let shares: string[] = [];
      for (let line in stdout.split(/\r?\n/)) {
        const words = line.split(/\t/);
        if (words.length > 2 && words[2].match(/^\s*$/) !== null) {
          shares.push(words[2].trim());
        }
      }
      return shares;
    });
  }
}
