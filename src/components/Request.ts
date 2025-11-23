import { Context } from 'koishi'
import { cmdType } from '../commands/Index'
import { RequestHandler } from './DataHandler'
import { QueueElement } from './Queue';


export class Request {
    private readonly ctx: Context;
    private readonly baseUrl = "https://api.vndb.org/kana/";
    private type: cmdType;
    private keyword: string;
    private url: string;
    private field: string;
    private method: any;
    private filters: any;


    constructor(_ctx: Context, _elem: QueueElement) {
        this.ctx = _ctx;
        this.type = _elem.type;
        this.keyword = _elem.value;
        this.method = _elem.method ?? 'search';
        this.field = _elem.field as string ?? this.type;
        this.filters = _elem.filters ?? [this.method, '=', this.keyword];
        this.url = this.baseUrl + this.field;
    }

    async request(): Promise<object> {
        for (let i = 0; i < this.ctx.config.retryCount; i++) {
            try {
                let payload = this.buildPayload();
                
                return await this.ctx.http.post(this.url, payload, {
                    headers: { "Content-Type": "application/json" }
                });
            } catch {
                this.ctx.logger.warn(`${this.url}第${i + 1}次请求失败...`);
            }
        }
        throw new Error(`${this.url}多次请求失败...`)
    }

    private buildPayload(): object {
        const fields = RequestHandler.buildFields(this.type, this.field);

        if (this.field === cmdType.VN) {
            return {
                "filters": this.filters,
                "fields": fields,
                "sort": "rating",
                "reverse": true
            };
        } else if (this.field === cmdType.Character || this.field === cmdType.Producer) {
            return {
                "filters": this.filters,
                "fields": fields
            };
        } else throw new Error('错误的构建命令类型！');
    }
}

export default Request;