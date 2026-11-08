/* Gameplay cycle 3.0: pure, dependency-free board rules. No SDK or save-schema changes. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.BerriesGameplay3=api;
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const key=(r,c)=>r+','+c;
 const dimensions=(grid)=>({rows:grid.length,cols:grid[0]?.length||0});
 const inside=(r,c,rows=8,cols=8)=>r>=0&&c>=0&&r<rows&&c<cols;
 function tileMatches(grid){
   const {rows,cols}=dimensions(grid),found=new Set();
   for(let r=0;r<rows;r++)for(let c=0;c<cols;){
     const id=grid[r][c]?.id;let end=c+1;
     if(!id){c++;continue}
     while(end<cols&&grid[r][end]?.id===id)end++;
     if(end-c>=3)for(let x=c;x<end;x++)found.add(key(r,x));
     c=end;
   }
   for(let c=0;c<cols;c++)for(let r=0;r<rows;){
     const id=grid[r][c]?.id;let end=r+1;
     if(!id){r++;continue}
     while(end<rows&&grid[end][c]?.id===id)end++;
     if(end-r>=3)for(let y=r;y<end;y++)found.add(key(y,c));
     r=end;
   }
   return found;
 }
 function legalMoves(grid,blocked=new Set()){
   const {rows,cols}=dimensions(grid),moves=[];
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
     if(blocked.has(key(r,c))||!grid[r][c]?.id)continue;
     for(const [dr,dc] of [[0,1],[1,0]]){
       const y=r+dr,x=c+dc;
       if(!inside(y,x,rows,cols)||blocked.has(key(y,x))||!grid[y][x]?.id)continue;
       const first=grid[r][c],second=grid[y][x];
       if(first.id===second.id&&!first.sp&&!second.sp)continue;
       grid[r][c]=second;grid[y][x]=first;
       const matches=tileMatches(grid);
       const useful=matches.has(key(r,c))||matches.has(key(y,x));
       grid[r][c]=first;grid[y][x]=second;
       if(useful||first.sp||second.sp)moves.push({a:{r,c},b:{r:y,c:x},matches:useful?matches.size:0});
     }
   }
   return moves;
 }
 // Non-mutating plan: cells marked as barriers divide a column into independent fall segments.
 // Grid item: null | {kind:'berry', id, sp} | {kind:'acorn'}.
 function gravityPlan(grid,barriers=new Set(),exits=new Set()){
   const {rows,cols}=dimensions(grid),result=grid.map(row=>row.slice());
   const moves=[],spawn=[],collected=[];
   for(let c=0;c<cols;c++){
     let r=rows-1;
     while(r>=0){
       if(barriers.has(key(r,c))){r--;continue}
       const bottom=r;
       while(r>=0&&!barriers.has(key(r,c)))r--;
       const top=r+1;
       const items=[];
       for(let y=bottom;y>=top;y--)if(grid[y][c])items.push({item:grid[y][c],from:y});
       for(let y=top;y<=bottom;y++)result[y][c]=null;
       let dest=bottom;
       for(const entry of items){
         if(entry.item.kind==='acorn'&&dest===rows-1&&exits.has(key(dest,c))){
           collected.push({from:{r:entry.from,c},exit:{r:dest,c},item:entry.item});
           continue;
         }
         result[dest][c]=entry.item;
         moves.push({from:{r:entry.from,c},to:{r:dest,c},item:entry.item});
         dest--;
       }
       while(dest>=top){spawn.push({r:dest,c,top,belowBarrier:top>0});dest--}
     }
   }
   return {grid:result,moves,spawn,collected};
 }
 function madnessCandidates(grid,blocked=new Set()){
   const {rows,cols}=dimensions(grid),result=[];
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
     if(blocked.has(key(r,c))||!grid[r][c]?.id)continue;
     for(const [dr,dc] of [[0,1],[1,0]]){
       const y=r+dr,x=c+dc;
       if(!inside(y,x,rows,cols)||blocked.has(key(y,x))||!grid[y][x]?.id)continue;
       if(grid[r][c].sp||grid[y][x].sp||grid[r][c].id===grid[y][x].id)continue;
       const a=grid[r][c],b=grid[y][x];
       grid[r][c]=b;grid[y][x]=a;
       const set=tileMatches(grid);
       grid[r][c]=a;grid[y][x]=b;
       result.push({a:{r,c},b:{r:y,c:x},matches:set.size});
     }
   }
   return result;
 }
 function chooseMadness(grid,blocked,stage=1,random=Math.random){
   const all=madnessCandidates(grid,blocked);
   if(!all.length)return null;
   // At level 6, 85% helpful moves when they exist; gradually less predictable.
   const useful=all.filter(m=>m.matches>0);
   const probability=Math.max(.20,.85-(Math.max(1,stage)-1)*.20);
   const pool=useful.length&&random()<probability?useful:all;
   return pool[Math.floor(random()*pool.length)]||null;
 }
 function blockedCells(cell){
   const result=new Set();
   for(let r=0;r<cell.length;r++)for(let c=0;c<cell[r].length;c++){
     const t=cell[r][c];
     if(t.block||t.ice||t.acorn)result.add(key(r,c));
   }
   return result;
 }
 return Object.freeze({key,inside,tileMatches,legalMoves,gravityPlan,madnessCandidates,chooseMadness,blockedCells});
});
