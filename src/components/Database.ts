import { Context, Driver, Query } from 'koishi'
import { cmdType } from "../commands/Index";

export class Database {
    static async refresh(ctx: Context, date: Date): Promise<{
        id: number;
        vndbID: string;
        date: Date;
        type: string;
        keyword: string;
        textData: string;
    }[]> {
        const res = await ctx.database.get("vndb", {
            date: {
                $lte: date,
                $gte: new Date(1)
            }
        });

        ctx.database.remove("vndb", {
            date: {
                $lte: date,
                $gte: new Date(1)
            }
        })
        return res;
    }

    static async refreshToday(ctx: Context): Promise<Driver.WriteResult> {
        try {
            const now = new Date();
            const res = ctx.database.remove("vndb", {
                date: {
                    $lte: now,
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                }
            })
            ctx.logger.success('重新加载插件，今日数据库数据自动清空...');
            if (ctx.config.detailMsg) ctx.logger.success(`删除今日数据库缓存数据共${(await res).matched}条！`);
            return res;
        } catch (e) {
            // 如果没有数据库
            ctx.model.extend('vndb', {
                'id': 'unsigned',
                vndbID: 'string',
                date: 'date',
                type: 'string',
                keyword: 'string',
                textData: 'text'
            }, {
                primary: 'id',
                autoInc: true
            })
        }
    }

    static async select(ctx: Context, type: cmdType, keyword: string, id: string): Promise<{
        id: number;
        vndbID: string;
        date: Date;
        type: string;
        keyword: string;
        textData: string;
    } | null> {
        let data: Array<any> = [];
        if (id) {
            data = await ctx.database.get("vndb", {
                type: type,
                vndbID: id
            })
        }
        if (data.length === 0) {
            data = await ctx.database.get("vndb", {
                type: type,
                keyword: keyword
            })
        }

        if (data.length === 0) return null;
        else if (data.length === 1) {
            return data[0];
        } else throw new Error('数据库记录重复数据！');
    }

    static async insert(ctx: Context, type: cmdType, keyword: string, id: string, textData: string) {
        return ctx.database.create("vndb", {
            vndbID: id ?? '',
            date: new Date(),
            type: type,
            keyword: keyword,
            textData: textData ?? ''
        })
    }

    static formattingDate(date?: Date) {
        if (!date) {
            date = new Date();
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

export default Database; 