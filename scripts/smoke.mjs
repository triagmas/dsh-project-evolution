import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { EvolutionService } from '../src/core/service.js'
import { createRoutes } from '../src/core/routes.js'

const root = await mkdtemp(join(tmpdir(), 'pe-smoke-'))
execFileSync('git', ['init','-q'], { cwd: root })
await writeFile(join(root, 'README.md'), '# demo\n')
await mkdir(join(root, 'src'), { recursive: true })
await writeFile(join(root, 'src', 'math.js'), 'export const add = (a,b) => a+b\n')
const events = [
 {type:'turn/start',seq:1,time:new Date().toISOString(),data:{turn:1}},
 {type:'user/message',seq:2,time:new Date().toISOString(),data:{id:'u1',role:'user',content:[{type:'text',text:'Add subtraction to src/math.js and run the test command.'}],source:{kind:'user'}}},
 {type:'assistant/message',seq:3,time:new Date().toISOString(),data:{turn:1,step:1,message:{role:'assistant',content:[{type:'text',text:'I will edit and test.'}]}}},
 {type:'tool/call',seq:4,time:new Date().toISOString(),data:{turn:1,step:1,callId:'c1',name:'edit',arguments:JSON.stringify({file_path:'src/math.js',old_string:'add',new_string:'add\nsub'})}},
 {type:'tool/result',seq:5,time:new Date().toISOString(),data:{turn:1,step:1,message:{role:'tool',toolCallId:'c1',content:[{type:'text',text:'ok'}],isError:false}}},
 {type:'tool/call',seq:6,time:new Date().toISOString(),data:{turn:1,step:2,callId:'c2',name:'bash',arguments:JSON.stringify({command:'node --test test/math.test.js'})}},
 {type:'tool/result',seq:7,time:new Date().toISOString(),data:{turn:1,step:2,message:{role:'tool',toolCallId:'c2',content:[{type:'text',text:'# tests 2\n# pass 2\n# fail 0'}],isError:false}}},
 {type:'turn/end',seq:8,time:new Date().toISOString(),data:{turn:1,reason:{kind:'completed'}}},
]
const session = {id:'s1', header:{cwd:root,title:'demo'}, snapshotEvents:()=>events}
const ctx = {skills:{list:async()=>[],get:async()=>undefined},sessions:{get:(id)=>id==='s1'?session:undefined,list:()=>[session]}}
const home = await mkdtemp(join(tmpdir(),'pe-home-'))
const service = new EvolutionService({ctx, config:{}, logger:{info(){},warn(){},error(){}}, dshHome:home})
const ov = await service.overview('s1')
console.log('overview', ov.project.root, ov.catalog.project.length)
await service.captureTurn({agent:{session},turn:1,events})
const ov2 = await service.overview('s1')
console.log('after capture knowledge', ov2.status.counts.knowledge, 'proposals', ov2.status.counts.proposals, ov2.proposals[0]?.tests?.status)
const [route] = createRoutes(service, console).filter(r=>r.path.endsWith('/overview'))
const res = await route.fetch(new Request('http://x/api/project-evolution/overview?sessionId=s1'))
console.log('route', res.status, (await res.json()).ok)
const skillPath = join(root,'.dsh','skills', ov2.proposals[0].skill, 'SKILL.md')
console.log('proposal skill', ov2.proposals[0].skill, 'exists-before', await readFile(skillPath,'utf8').then(()=>true).catch(()=>false))
const applied = await service.action('s1',{action:'accept',proposalId:ov2.proposals[0].id,expectedRevision:ov2.proposals[0].revision})
console.log('accepted', applied.proposal.status, 'file', applied.file)
console.log(await readFile(skillPath,'utf8'))
