import { Context } from 'koishi'
import * as fs from 'fs';
import path from "path";


export class Downloader {
    static async downloadToPath(ctx: Context, url: string): Promise<string> {
        const targetDir = path.join(__dirname, 'cache/image');
        if (fs.existsSync(targetDir)) {
            const name = this.cutFileName(url);
            const file = path.join(targetDir, `${name}.jpg`);
            if (!fs.existsSync(file)) {
                for (let index = 0; index < ctx.config.retryCount; index++) {
                    try {
                        const buffer = await ctx.http.get(url, { responseType: 'arraybuffer' });
                        await fs.promises.writeFile(file, Buffer.from(buffer));
                        break;
                    } catch (err) {
                        if (index + 1 === ctx.config.retryCount) {
                            if (ctx.config.detailMsg) ctx.logger.warn(`最后一次下载图片「${url}」失败！将用备用图片替代。`);
                            return path.join(__dirname, 'resources/short.png');
                        }
                        if (ctx.config.detailMsg) ctx.logger.warn(`第${index + 1}次下载图片「${url}」失败...`);
                    }
                }
            }
            
            return file;
        } else throw new Error('初始化文件夹失败，下载图片失败！' + targetDir);

    }

    private static cutFileName(url: string): string {
        return url.split('/').pop()!.split('.')[0];
    }
}

export default Downloader;