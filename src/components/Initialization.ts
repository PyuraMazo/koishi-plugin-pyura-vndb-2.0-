import { Context } from 'koishi'
import DB from "../components/Database";
import * as fs from 'fs';
import path from "path";


export class Initialization {
    ctx: Context;

    constructor(_ctx: Context) {
        this.ctx = _ctx;
    }

    initAll() {
        this.initConfig();
        this.createFolder();
        this.downloadSources();
        this.cleanCache();
        DB.refreshToday(this.ctx);
    }

    private initConfig() {
        if (!this.ctx.config.outputContent) this.ctx.logger.warn('发送形式选项设置为空，将不会发送任何结果！');
    }

    private createFolder() {
        if (!fs.existsSync(path.join(__dirname, `cache/buffer`))) {
            fs.mkdir(path.join(__dirname, `cache/buffer`), { recursive: true }, (error) => {
                if (error) {
                    this.ctx.logger.error('buffer文件初始化失败！');
                }
            })
        }
        this.ctx.logger.success('buffer文件夹初始化成功！');
        if (!fs.existsSync(path.join(__dirname, `cache/image`))) {
            fs.mkdir(path.join(__dirname, `cache/image`), { recursive: true }, (error) => {
                if (error) {
                    this.ctx.logger.error('image文件夹初始化失败！');
                }
            })
        }
        this.ctx.logger.success('image文件夹初始化成功！');
    }

    private async downloadSources(){
        const folder = path.join(__dirname, `resources`);
        if (!fs.existsSync(folder)) {
            fs.mkdir(folder, async (error) => {
                if (error) {
                    this.ctx.logger.error('resources文件夹初始化失败！');
                }

                const bg = await this.ctx.http.get('https://img.cdn1.vip/i/68dde984e2362_1759373700.webp', {responseType: 'arraybuffer'});
                fs.writeFile(path.join(folder, 'bg.png'), Buffer.from(bg), (e) => {
                    if (e) this.ctx.logger.error('bg文件下载失败！');
                })
                const err = await this.ctx.http.get('https://img.cdn1.vip/i/68ddeae4c7eac_1759374052.webp', {responseType: 'arraybuffer'});
                fs.writeFile(path.join(folder, 'short.png'), Buffer.from(err), (e) => {
                    if (e) this.ctx.logger.error('short文件下载失败！');
                })
            })
        }
        this.ctx.logger.success('sources文件夹初始化成功！');
    }

    private cleanCache() {
        const now = new Date();
        const nowTimestamp = now.getTime();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayZeroTimestamp = todayZero.getTime();
        const oneDayInterval = 24 * 60 * 60 * 1000;
        if (this.ctx.config.databaseCache > 0) {
            const nextExecutionTime = todayZeroTimestamp + oneDayInterval - nowTimestamp + (this.ctx.config.databaseCache - 1) * oneDayInterval;

            this.ctx.setTimeout(() => {
                this.ctx.setInterval(() => {
                    this.cleanDBAndBuffer(oneDayInterval);
                }, oneDayInterval);

                this.cleanDBAndBuffer(oneDayInterval);
            }, nextExecutionTime);
        }
        if (this.ctx.config.localFileCache > 0) {
            const nextExecutionTime = todayZeroTimestamp + oneDayInterval - nowTimestamp + (this.ctx.config.localFileCache - 1) * oneDayInterval;

            this.ctx.setTimeout(() => {
                this.cleanLocalImage();
                this.ctx.setInterval(() => {
                    this.cleanLocalImage();
                }, this.ctx.config.localFileCache * oneDayInterval);
            }, nextExecutionTime);
        }
    }

    private cleanLocalImage() {
        const folderPath = path.join(__dirname, 'cache/image');

        fs.rm(folderPath, {
            recursive: true,
            force: true
        }, err => {
            if (err) this.ctx.logger.error('image缓存清除错误！\n' + err);
            this.createFolder();
        });

        this.ctx.logger.success('image缓存清除成功！\n时间：' + new Date());
    }

    private async cleanDBAndBuffer(oneDayInterval: number) {
        const folderPath = path.join(__dirname, 'cache/buffer');

        const nowTimeStamp = (new Date()).getTime();
        const res = await DB.refresh(this.ctx, new Date(nowTimeStamp - (this.ctx.config.databaseCache - 1) * oneDayInterval));
        const firstID = res.at(0).id;
        const lastID = res.at(-1).id;
        for (let index = firstID; index <= lastID; index++) {
            fs.rm(path.join(folderPath, `${index}.bin`), err => {
            if (err) this.ctx.logger.error(`buffer缓存清除错误！(${index})\n` + err);
        });
            
        }
    }
}
export default Initialization;