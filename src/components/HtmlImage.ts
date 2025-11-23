import { cmdType } from '../commands/Index';
import path from "path";
import * as fs from 'fs';


export class HtmlImage {
    // private keyword: string;

    private imgPath: string = path.join(__dirname, "resources/bg.png");
    // private imgPath: string = "./resources/bg.png";
    private title: string = '';
    private content = new Array<string>();

    build() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    padding: 0;
                    margin: 0;
                    font-size: 40px;
                }
                body {
                    display: flex;
                    flex-direction: column;
                    background-image: url("${this.imageToBase64(this.imgPath.replace(/\\/g, '/'))}");
                    background-size: cover;
                    background-repeat: no-repeat;
                    width: 900px;
                }
                h2 {
                    font-size: 80px;
                    text-align: center;
                }
                .content {
                    margin: 20px 0;
                    width: stretch;
                    overflow-x: hidden;
                }
                img {
                    display: block;
                    width: 400px;
                    height: auto;
                }
            </style>
        </head>
        <body>
            ${this.title}
            ${this.content.join('')}
        </body>
        </html>
        `;
    }

    changeBg(path: string) {
        this.imgPath = path;
    }

    createEventTitle(date: string) {
        const dayDic = ['日', '月', '火', '水', '木', '金', '土'];
        let y, m, d;
        [y, m, d] = date.split('-');
        const formatDate = [y, m.padStart(2, '0'), d.padStart(2, '0')];
        const D = new Date(formatDate.join('-'));
        this.title = `<h2>~  ${formatDate[0]}年${formatDate[1]}月${formatDate[2]}日  ~</h2>
                    <h2>~  ${dayDic[D.getDay()]}曜日  ~</h2>`;
    }

    createContentTitle(title: string): string {
        const contentTitle = `<h3>·${title}</h3>`;
        this.content.push(contentTitle);
        return contentTitle;
    }

    createContent(context: object): string {
        if (context['res']['img']) {
            const content = `<div class="content">
                        <img src="${this.imageToBase64(context['res']['img'].replace(/\\/g, '/'))}" alt="图片出错了">
                        ${context['res']['content'].join('<br>')}
                    </div>`;
            this.content.push(content);
            return content;
        } else {
            const content = `<div class="content">
                        ${context['res']['content'].join('<br>')}
                    </div>`;
            this.content.push(content);
            return content;
        }
    }

    getContent() {
        return this.content;
    }

    setContent(content: Array<string>) {
        this.content = content;
    }


    private imageToBase64(imagePath: string) {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64 = imageBuffer.toString('base64');
            const mimeType = 'image/jpg';
            return `data:${mimeType};base64,${base64}`;
        } catch (error) {
            console.log(`无法读取图片: ${imagePath}`, error.message);
            return '';
        }
    }


}

export default HtmlImage;