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

  private async runCommand(cmd: string, path: string, destination: string): Promise<string> {
    const workingDir   = dirname(path);
    const fileName     = basename(path).replace(singleSlash, '\\');
    const cmdArgs      = format('%s %s', fileName, destination);
    return await this.execute(cmd, cmdArgs, workingDir);
  }

  private execute(cmd: string, cmdArgs: string, workingDir: string): Promise<string> {
      const fullCmd = wrap(format('%s %s', cmd, cmdArgs));
      const command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');
      const options = { cwd : workingDir };
      return new Promise((done, failed) => {
        exec(command, options, (err, stdout, stderr) => {
          const allMessage = stdout + stderr;
          if (err) {
            console.log('An error occurred: ' + allMessage);
            failed(err);
          } else {
            done(allMessage);
          }
      });
    });

  }

  private getSmbClientArgs(fullCmd: string) : string[] {
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

  public async getFile(path: string, destination: string): Promise<string> {
    return await this.runCommand('get', path, destination);
  }

  public async sendFile(path: string, destination: string): Promise<string> {
    const consoleLog = await this.runCommand('put', path, destination.replace(singleSlash, '\\'));
    console.log('File was upload successfully!!');
    return consoleLog;
  }

  public async deleteFile(fileName: string): Promise<string> {
    const consoleLog = await this.execute('del', fileName, '');
    console.log('File was delete successfully!!');
    return consoleLog;
  }

  public async listFiles(fileNamePrefix: string, fileNameSuffix: string): Promise<string> {
    const cmdArgs = format('%s*%s', fileNamePrefix, fileNameSuffix);
    return await this.execute('dir', cmdArgs, '');
  }

  public async mkdir(remotePath: string): Promise<string> {
    return await this.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname);
  }

  public async dir(remotePath: string): Promise<string> {
    return await this.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname);
  }

  public async customCommand(cmd: string): Promise<string> {
    return await this.execute(cmd, '', __dirname);
  }
}
