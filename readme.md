# koishi-plugin-pyura-vndb

  

[![npm](https://img.shields.io/npm/v/koishi-plugin-pyura-vndb?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-pyura-vndb)
# VNDB 查询插件（2.0）

## 介绍
Koishi.js的插件，调用了VNDB的API，实现了通过Gal名、厂商名和角色名查找相关信息的功能。

## ✨ 新特性
- 提供更简便的指令。
- 提供了更个性化的工作台设置。
- 通过对图片输出结果的支持，实现了以图片形式呈现尽可能多和完整的查询结果，解决了因发送文字量过大导致某些平台发送失败的问题。
- 添加了任务处理队列，每个群聊共享一个队列。
- 支持对所有查询指令输出图片和文字结果。
- 所有指令不再支持搜索多个关键词，以此规避了某些关键词中的空格把关键词错误地解析成多个片段。
- 压缩了数据库记录的数据量，并为数据库和本地缓存添加了定时清理的功能。
## 📖查询指令

### 查询作品 - `vndb.vn`（别名`vndb.v`/`vn`）
- `vn 作品名`
### 查询角色 - `vndb.character`（别名`vndb.c`/`character`）
- `vndb.c 角色名`
### 查询作者 - `vndb.producer`（别名`vndb.p`/`producer`）
- `producer 公司名/作者名`
### 以VNDB唯一ID查询 - `vndb.id`（别名`vndb.i`/`id`）
- `id VNDB唯一ID`
### 查询某天的发布作品和角色生日 - `vndb.event`（别名`vndb.e`/`event`）
- `event` 查询当天
- `event mm-dd` 查询某月某日
## ⚙️控制指令
### 更全面的指令帮助
- ~~`help vndb`~~
- ~~`vndb.help`~~
### 队列状态

- `queue`
## 🐛问题反馈
如果你遇到任何问题或者有任何改进建议，请通过以下方式联系我：
- 邮箱：1605025385@qq.com