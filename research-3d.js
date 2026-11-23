
/* Perspective renderer for the schematic research scenes. */
function createResearchScene(canvas, scene, onStep = () => {}) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const blue = '#5cc5ff', gold = '#ffb94d', green = '#a0df6c', pink = '#ff75a8';
  const tau = Math.PI * 2;
  const labels = [
    ['', 'Charge pulse  →  spin transfer  →  magnetization'],
    ['Coupled dynamics', 'Electron drift  /  spin wave  /  lattice wave'],
    ['Tunnel readout', 'Parallel: lower R   /   Antiparallel: higher R'],
    ['Stochastic p-bits', 'Binary states in a connected network'],
    ['Altermagnets', 'Compensated order  /  Alternating spin splitting']
  ];
  let time = 0, previous, frame, running = false, bits = [], recent = [], lastSample = -1;
  let shapes, tags, phaseLabel;
  const cameras = [[.31,.29,7.95],[.10,.08,10.35],[.34,.24,7.8],[.24,.15,8.5],[.12,.44,9.15]];
  let camera;
  const duration = scene === 0 ? 18 : scene === 1 ? 18.4 : scene === 2 ? 13.2 : scene === 4 ? 14.4 : 4.8;
  let reportedStep = -1;
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  function project([x, y, z]) {
    const {yaw, pitch, unit, width, height} = camera;
    const X = x * Math.cos(yaw) - z * Math.sin(yaw);
    const Z = x * Math.sin(yaw) + z * Math.cos(yaw);
    const Y = y * Math.cos(pitch) - Z * Math.sin(pitch);
    const depth = y * Math.sin(pitch) + Z * Math.cos(pitch);
    const scale = 10 / (10 - depth);
    return {x:width / 2 + X * unit * scale, y:height * (scene===0?.518:.54) - Y * unit * scale, depth, scale};
  }

  function polygon(vertices, color, edge) {
    const points = vertices.map(project);
    shapes.push({depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length, draw() {
      context.beginPath();
      points.forEach(({x,y},i)=>i ? context.lineTo(x,y) : context.moveTo(x,y));
      context.closePath();
      const top = Math.min(...points.map(p=>p.y));
      const bottom = Math.max(...points.map(p=>p.y));
      const metal = context.createLinearGradient(0,top,0,Math.max(top+1,bottom));
      metal.addColorStop(0,color[0]);
      metal.addColorStop(.21,color[1]);
      metal.addColorStop(.58,color[1]);
      metal.addColorStop(1,color[2]);
      context.fillStyle = metal;
      context.fill();
      context.strokeStyle = edge;
      context.lineWidth = 1;
      context.stroke();
    }});
  }

  function slab(x, y, z, w, h, d, palette) {
    const a=[x-w/2,y-h/2,z-d/2], b=[x+w/2,y-h/2,z-d/2], c=[x+w/2,y+h/2,z-d/2], e=[x-w/2,y+h/2,z-d/2];
    const front = ([X,Y,Z])=>[X,Y,Z+d];
    const [A,B,C,E]=[a,b,c,e].map(front);
    polygon([A,B,C,E],palette[0],'#8ba5be');
    polygon([b,B,C,c],palette[1],'#577897');
    polygon([e,c,C,E],palette[2],'#abc4db');
  }

  function solidArrow(start, end, radius, palette) {
    const a = project(start), b = project(end);
    const length = Math.hypot(b.x-a.x,b.y-a.y);
    if (length < 1) return;
    const ux = (b.x-a.x)/length, uy = (b.y-a.y)/length;
    const r = Math.max(2,radius*camera.unit*(a.scale+b.scale)/2);
    const head = Math.min(length*.35,r*4);
    const shoulder = length-head;
    const points = [[0,-r],[shoulder,-r],[shoulder,-r*1.8],[length,0],[shoulder,r*1.8],[shoulder,r],[0,r]];
    const colors = palette[0];
    const round = Math.min(4,r*.5);
    const near = (one,two) => {
      const scale = round / Math.max(round,Math.hypot(two[0]-one[0],two[1]-one[1]));
      return [one[0]+(two[0]-one[0])*scale,one[1]+(two[1]-one[1])*scale];
    };

    shapes.push({depth:(a.depth+b.depth)/2,draw() {
      context.save();
      context.translate(a.x,a.y);
      context.transform(ux,uy,-uy,ux,0,0);
      const gradient = context.createLinearGradient(0,-r*2,0,r*2);
      gradient.addColorStop(0,colors[0]);
      gradient.addColorStop(.43,colors[1]);
      gradient.addColorStop(1,colors[2]);
      context.fillStyle = gradient;
      context.shadowColor = colors[1];
      context.shadowBlur = 8;
      context.beginPath();
      points.forEach((point,i)=>{
        const before = near(point,points[(i+points.length-1)%points.length]);
        const after = near(point,points[(i+1)%points.length]);
        if (i===0) context.moveTo(...before); else context.lineTo(...before);
        context.quadraticCurveTo(...point,...after);
      });
      context.closePath();
      context.fill();
      context.restore();
    }});
  }

  function glassEdges(x,y,z,w,h,d,color) {
    const corners=Array.from({length:8},(_,i)=>[x+(i&1?w:-w)/2,y+(i&2?h:-h)/2,z+(i&4?d:-d)/2]);
    for(let i=0;i<8;i++) for(const bit of [1,2,4]) {
      if(!(i&bit)) line(corners[i],corners[i|bit],color,(i&4)?1.35:.8);
    }
  }

  function sphere(point, radius, color) {
    const p=project(point);
    const r=radius*camera.unit*p.scale;
    shapes.push({depth:p.depth, draw() {
      const gradient=context.createRadialGradient(p.x-r*.32,p.y-r*.34,0,p.x,p.y,r);
      gradient.addColorStop(0,'#ffffff');
      gradient.addColorStop(.24,color);
      gradient.addColorStop(.62,color);
      gradient.addColorStop(1,'#122240');
      context.shadowColor=color;
      context.shadowBlur=11;
      context.fillStyle=gradient;
      context.beginPath();
      context.arc(p.x,p.y,r,0,tau);
      context.fill();
      context.shadowBlur=0;
    }});
  }

  function line(start, end, color, width=2, arrow=false) {
    const a=project(start), b=project(end);
    shapes.push({depth:(a.depth+b.depth)/2, draw() {
      context.strokeStyle=color;
      context.fillStyle=color;
      context.lineWidth=width;
      context.shadowColor=color;
      context.shadowBlur=arrow ? width*1.8 : 0;
      context.lineCap='round';
      context.beginPath(); context.moveTo(a.x,a.y); context.lineTo(b.x,b.y); context.stroke();
      if (!arrow) return;
      const angle=Math.atan2(b.y-a.y,b.x-a.x), length=width*4;
      context.beginPath(); context.moveTo(b.x,b.y);
      for (const turn of [-.52,.52]) context.lineTo(b.x-length*Math.cos(angle+turn),b.y-length*Math.sin(angle+turn));
      context.closePath(); context.fill();
      context.shadowBlur=0;
    }});
  }

  function orbit([x,y,z], radius, color) {
    for (let i=0;i<16;i++) {
      const from=i*tau/16, to=(i+1)*tau/16;
      line([x+radius*Math.cos(from),y,z+radius*Math.sin(from)],
           [x+radius*Math.cos(to),y,z+radius*Math.sin(to)],color,1);
    }
  }

  const magnetic = [['#ffd482','#af681e','#78400e'],['#a86825','#663807','#3c2109'],['#fff0ba','#e1a347','#aa681c']];
  const channel = [['#8eb9da','#395b83','#183254'],['#658ba8','#284569','#122440'],['#c5ddf2','#6894b8','#3a6290']];
  const substrate = [['#9cabbc','#536479','#2f3e51'],['#62748a','#344254','#182635'],['#d9e3eb','#95a6b9','#556d84']];
  const barrier = [['#ffe5aa','#dd9036','#9f5422'],['#cb862e','#95521f','#583417'],['#fff3c9','#ffd88c','#d89238']];

  function annotate(text, point, color) {
    const p=project(point);
    tags.push([text,color,p.x,p.y,'center']);
  }

  const glass = [
    ['#a395f47a','#6966c751','#36367a87'],
    ['#8175df85','#5156ac5c','#33366677'],
    ['#dbd4ff8e','#8b83de5c','#666bb35e']
  ];
  const tealGlass = [
    ['#c9fff3bb','#5dcdb8a0','#267980ab'],
    ['#9ef0e0bc','#45a5a09c','#246773b4'],
    ['#e1fff4da','#97ead6b8','#58c2bab2']
  ];
  const momentMetal = [
    ['#f7ffff','#87d6fa','#356398'],
    ['#b9eaff','#66a7d6','#243e72'],
    ['#ffffff','#c0eafa','#548fb7']
  ];

  function switching(t) {
    // Screen-space world axes: [x, z, -y]. Here z is the physical film normal.
    const step=Math.min(5,Math.floor(t/3));
    const local=t-step*3;
    const orbital=step===1 || (step===2 && local<1.4);
    const fullMTJ=step>=4;
    const read=step===5;
    const tilt=step===3 ? .60*Math.min(1,local*1.7)
      : step===4 ? .60+(Math.PI-.60)*Math.min(1,local/1.8)
      : read ? Math.PI : 0;
    if(step!==reportedStep){reportedStep=step;onStep(step);}

    slab(0,-1.02,0,5.44,.14,2.18,substrate);
    slab(0,-.56,0,5.25,.77,2.02,glass);
    glassEdges(0,-.56,0,5.25,.77,2.02,'#b4c4ff72');
    slab(0,-.045,0,3.18,.26,1.68,tealGlass);
    if(fullMTJ){
      slab(0,.143,0,3.18,.116,1.68,barrier);
      slab(0,.38,0,3.18,.35,1.68,channel);
      slab(0,.66,0,.78,.18,1.0,substrate);


    }



    const free=[-.84,-.05,.92];
    const tip=[free[0],free[1]+.62*Math.cos(tilt),free[2]-.62*Math.sin(tilt)];
    sphere(free,.064,'#dbf8ff');
    solidArrow(free,tip,.061,momentMetal);
    if(fullMTJ){
      const ref=[.30,.38,.91];
      solidArrow(ref,[ref[0],ref[1]+.52,ref[2]],.054,momentMetal);
    }

    if(step<=2){
      // Both carrier channels drift toward −x. Hall separation sends opposite
      // polarizations toward the two film surfaces as the trajectories diverge.
      const track=(fraction,sign)=>{
        const split=clamp((fraction-.28)/.72,0,1);
        const eased=split*split*(3-2*split);
        const end=sign>0?(step===2?.20:.09):-.88;
        return [2.08-3.24*fraction,-.54+(end+.54)*eased,.9+sign*.045];
      };
      for(const sign of [1,-1]){
        const lower=sign<0;
        const color=orbital?(lower?'#df9465':gold):(lower?pink:blue);
        const samples=Array.from({length:19},(_,i)=>track(.28+i*.72/18,sign));
        samples.slice(1).forEach((point,i)=>line(samples[i],point,color+'91',i===17?2.3:1.45,i===17));
        for(let i=0;i<3;i++){
          const f=(local*.62+i*.32+(lower?.15:0))%1;
          const [x,y,z]=track(f,sign);
          if(orbital && !(step===2 && y>-.16)){
            for(const side of [-1,1]) sphere([x+side*.073,y+side*.045*sign,z-side*.038],.055,color);
          }else {
            sphere([x,y,z],.073,orbital?blue:color);
            // The polarization glyph points along in-plane ±y, not along z flow.
            line([x,y,z+.08*sign],[x,y,z-.19*sign],'#e4f4ff',1.25,true);
          }
        }
      }
      const straight=[[2.44,-.54,.91],[1.16,-.54,.91]];
      line(straight[0],straight[1],'#a6b9d8a0',1.5,true);
    }
    if(step===3){
      line([-2.08,.42,.16],[-1.2,.42,.16],'#ffc973',2.2,true);


    }
    if(read){
      line([.94,.89,.94],[.94,-.42,.94],green,2.7,true);
      for(let i=0;i<3;i++) sphere([.94,.86-((local*.80+i*.42)%1.26),.95],.058,green);

    }

    phaseLabel=[
      'Charge +x  /  Spin flow +z  /  In-plane spin polarization ±y',
      'Charge +x  /  Orbital flow +z  /  In-plane orbital polarization ±y',
      orbital?'Orbital flow can convert into spin near the interface':'Spin flows across the interface into the free layer',
      'The assist field breaks symmetry for deterministic writing',
      'PMA: the free layer switches from +z to −z',
      'Free and reference layers are antiparallel  /  Higher resistance'
    ][step];
  }

  function switchingLegend(width,height,pad,t) {
    const step=Math.min(5,Math.floor(t/3));
    const colors=['#195b81','#89501f','#195b81','#775325','#245b54','#246345'];
    const stages=['Spin Hall effect','Orbital Hall effect','Interface transfer','Spin torque + assist field','Perpendicular switching','MTJ readout'];
    context.font='700 '+Math.max(13,Math.min(19,width*.042))+'px Arial,sans-serif';
    context.fillStyle=colors[step];
    context.fillText(stages[step],pad,pad+7,width-2*pad);
    context.font='500 '+Math.max(10,Math.min(14,width*.031))+'px Arial,sans-serif';
    context.fillStyle='#344f65';
    const guide=step<3?'Electrons drift left and separate toward opposite surfaces':step===3?'An in-plane assist field selects a switching direction':step===4?'Free layer reverses; reference layer stays fixed':'Read current passes vertically through the MgO barrier';
    context.fillText(guide,pad,pad+25,width-2*pad);
    if (step!==5) {
      const a=project([0,-.55,0]), b=project([1,-.55,0]);
      const slope=Math.atan2(b.y-a.y,b.x-a.x);
      const half=width*.235, x=width/2, y=height*.81;
      context.save(); context.translate(x,y);context.rotate(slope);
      context.beginPath();context.moveTo(-half,0);context.lineTo(half,0);
      context.moveTo(half-8,-5);context.lineTo(half,0);context.lineTo(half-8,5);
      context.strokeStyle='#a05277';context.lineWidth=2;context.lineCap='round';context.lineJoin='round';context.stroke();context.restore();
      context.fillStyle='#754061';context.textAlign='center';
      context.fillText('Conventional charge current (+x)',width/2,y+Math.sin(slope)*half+13,width-2*pad);
      context.textAlign='left';
    }
  }

  function drawInterconversion(width,height,time) {
    context.save();context.scale(width/760,height/500);
    const handed=time<9.2?1:-1, t=time%9.2;
    const routes=[
      {end:132,heading:'Orbital angular momentum',mechanism:'Spin-orbit coupling',color:'#925828',light:'#e8a34b',labelY:123,offset:0},
      {end:252,heading:'Magnon',mechanism:'Exchange coupling',color:'#754c89',light:'#b47bc6',labelY:238,offset:.8},
      {end:374,heading:'Chiral phonon',mechanism:'Spin-lattice coupling',color:'#33705a',light:'#71ba91',labelY:405,offset:1.6}
    ];
    const text=(value,x,y,size,color='#263f55',weight=500,align='left')=>{
      context.font=weight+' '+size+'px Arial,sans-serif';context.fillStyle=color;
      context.textAlign=align;context.fillText(value,x,y);context.textAlign='left';
    };
    const stroke=(points,color,weight=1)=>{
      context.beginPath();points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
      context.strokeStyle=color;context.lineWidth=weight;context.lineJoin='round';context.lineCap='round';context.stroke();
    };
    const circle=(x,y,r,fill,edge)=>{
      context.beginPath();context.arc(x,y,r,0,tau);
      if(fill){context.fillStyle=fill;context.fill();}
      if(edge){context.strokeStyle=edge;context.lineWidth=1.2;context.stroke();}
    };
    const bead=(x,y,r,color,shade='#274766')=>{
      const g=context.createRadialGradient(x-r*.32,y-r*.35,0,x,y,r);
      g.addColorStop(0,'#fff');g.addColorStop(.36,color);g.addColorStop(1,shade);
      circle(x,y,r,g);
    };
    const arrow=(a,b,color,weight)=>{
      stroke([a,b],color,weight);
      const angle=Math.atan2(b[1]-a[1],b[0]-a[0]), head=6+weight;
      stroke([[b[0]-head*Math.cos(angle-.50),b[1]-head*Math.sin(angle-.50)],b,[b[0]-head*Math.cos(angle+.50),b[1]-head*Math.sin(angle+.50)]],color,weight);
    };
    const travel=(end,s)=>{
      const u=1-s;
      return [199*u*u*u+271*3*u*u*s+265*3*u*s*s+408*s*s*s,
        252*u*u*u+252*3*u*u*s+end*3*u*s*s+end*s*s*s];
    };
    const markAxis=(x,y,color)=>{
      circle(x,y,7,null,color);
      if(handed>0)circle(x,y,2.1,color);
      else {
        stroke([[x-2.7,y-2.7],[x+2.7,y+2.7]],color);
        stroke([[x-2.7,y+2.7],[x+2.7,y-2.7]],color);
      }
    };

    text('Angular momentum transfer across interfaces',31,44,25,'#203b55',700);
    text('Three possible pathways from electron spin',31,70,16,'#526b7e');
    text('Electron spin',105,190,19,'#205f82',700,'center');
    stroke([[44,252],[195,252]],'#86afc4',2);
    for(let i=0;i<3;i++){
      const x=57+(t*31+i*38)%108;
      bead(x,252,10,'#79c8ed');
      markAxis(x,222,'#267694');
    }
    text(handed>0?'Spin along +z':'Spin along −z',105,294,15,'#39657d',600,'center');

    routes.forEach(({end,heading,mechanism,color,light,labelY,offset})=>{
      const progress=(t+3-offset)%3;
      const points=Array.from({length:30},(_,i)=>travel(end,i/29));
      stroke(points,light+'36',7);
      stroke(points,color+'9b',1.7);
      arrow(points.at(-3),points.at(-1),color,1.8);
      if(progress<2.15){
        const [x,y]=travel(end,progress/2.15);
        circle(x,y,10,light+'44');
        bead(x,y,5.6,light,color);
      }
      text(mechanism,251,labelY,13,color,600);
      text(heading,442,end-35,17,color,700);
    });

    // The tilting lobes show phase in a schematic mode, not an electron orbit.
    const orbitalY=141, sitesX=[465,514,563,612];
    stroke([[448,orbitalY],[628,orbitalY]],'#c6a68b',1.4);
    for(let i=0;i<sitesX.length;i++){
      const x=sitesX[i], phase=t*2.75-i*.78;
      const packet=(t-2.15+9)%3;
      const brightness=Math.max(0,1-Math.abs(packet-i*.14)/.29);
      if(brightness>0) circle(x,orbitalY,18+2*brightness,'#e49a4845');
      context.save();
      context.translate(x,orbitalY);
      context.rotate(-.47+handed*.32*Math.sin(phase));
      for(const side of [-1,1]){
        const center=side*9.5;
        const g=context.createRadialGradient(center-3,-3,0,center,0,13);
        g.addColorStop(0,'#fff4dc');g.addColorStop(.42,'#eca759');g.addColorStop(1,side>0?'#a66436':'#8c522f');
        context.beginPath();context.ellipse(center,0,12,6.2,0,0,tau);
        context.fillStyle=g;context.fill();
      }
      context.restore();
      circle(x,orbitalY,2.4,'#a2663d');
    }
    arrow([452,162],[631,162],'#ae754b',1.1);
    markAxis(660,136,'#925828');text(handed>0?'+L':'−L',648,161,14,'#925828',700);
    text('z',663,164,10,'#925828',700);

    const spinY=269;
    stroke([[448,spinY],[672,spinY]],'#a484ae',1.3);
    for(let i=0;i<6;i++){
      const x=453+i*43, angle=handed*(t*6.4-i*.70), tip=[x+13*Math.cos(angle),spinY-20-4*Math.sin(angle)];
      context.beginPath();context.ellipse(x,spinY-20,13,4,0,0,tau);
      context.strokeStyle='#a782ba';context.lineWidth=1;context.stroke();
      bead(x,spinY,4.7,'#c296d3','#725788');
      arrow([x,spinY],tip,'#754c89',1.55);
    }

    const amp=6.5;
    const sites=Array.from({length:2},(_,row)=>Array.from({length:5},(_,col)=>{
      const x=448+col*39,y=374+row*26,a=handed*(t*6.5-col*.72-row*.45);
      return {x,y,dx:x+amp*Math.cos(a),dy:y-amp*Math.sin(a)};
    }));
    sites.forEach((row,r)=>row.forEach((site,c)=>{
      for(const next of [row[c+1],sites[r+1]?.[c]]){
        if(!next)continue;
        stroke([[site.x,site.y],[next.x,next.y]],'#8ea99d90');
        stroke([[site.dx,site.dy],[next.dx,next.dy]],'#619578',1.45);
      }
    }));
    sites.flat().forEach(site=>{
      circle(site.x,site.y,amp,null,'#9abaac');
      bead(site.dx,site.dy,4.7,'#9cd5aa','#4d876d');
    });
    arrow([637,399],[663,399],'#47785d',1.15);
    arrow([637,399],[637,375],'#47785d',1.15);
    text('x',668,404,13,'#33705a');text('y',634,369,13,'#33705a');
    text(handed>0?'CCW · +L':'CW · −L',542,438,15,'#33705a',700);
    text('z',handed>0?614:603,441,10,'#33705a',700);
    text('Viewed from +z',542,461,12,'#547467');
    context.restore();
  }

  let bias = 0;
  let biasLabel = 'Balanced bias';
  function stochastic(t) {
    const condition = Math.floor(t/4.5)%3;
    bias = [0,-1.6,1.6][condition];
    biasLabel = ['Balanced bias','Bias favors 0','Bias favors 1'][condition];
    const batch=Math.floor(t*8);
    if(batch!==lastSample) {
      const equilibrium=1/(1+Math.exp(-bias));
      const previous=recent.at(-1) ?? false;
      const toggle=.56*(previous ? 1-equilibrium : equilibrium);
      recent.push(Math.random()<toggle?!previous:previous);
      if(recent.length>32) recent.shift();
      lastSample=batch;
    }
    const state=recent.at(-1);
    const junctionX=-2.25;
    slab(junctionX,.42,0,1.55,.33,1.25,magnetic);
    slab(junctionX,.12,0,1.55,.092,1.25,barrier);
    slab(junctionX,-.16,0,1.55,.33,1.25,channel);
    slab(junctionX,-.54,0,1.8,.14,1.42,substrate);
    const face = .638;
    const left = junctionX-.33, right = junctionX+.33;
    line([state?right:left,.42,face],[state?left:right,.42,face],state?pink:blue,2.6,true);
    line([left,-.16,face],[right,-.16,face],blue,2.6,true);
    const output = [-.66,-.15,face];
    line([junctionX+.78,-.15,face],output,'#6ab6c9',1.65);
    sphere(output,.062,state?pink:blue);
    phaseLabel='Synthetic samples  /  '+(state?'Antiparallel · 1':'Parallel · 0');
  }


  function materialDiagram(width,height,paint) {
    context.save();
    context.scale(width/640,height/420);
    const red='#ff7d88', blue='#6abaff', ice='#e9f4ff', subtle='#a9c2d9';
    const text=(value,x,y,size=15,color=ice,align='left',weight=500)=>{
      context.font=weight+' '+size+'px Arial,sans-serif';
      context.textAlign=align;
      context.fillStyle=color;
      context.fillText(value,x,y);
    };
    const path=(points,color,weight=1)=>{
      context.beginPath();
      points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
      context.strokeStyle=color;
      context.lineWidth=weight;
      context.lineJoin='round';
      context.lineCap='round';
      context.stroke();
    };
    const ellipse=(x,y,rx,ry,color,solid=true)=>{
      context.beginPath();context.ellipse(x,y,rx,ry,0,0,tau);
      if(solid){context.fillStyle=color;context.fill();}
      else {context.strokeStyle=color;context.lineWidth=1.5;context.stroke();}
    };
    const atom=(x,y,color)=>{
      const shade=context.createRadialGradient(x-3,y-4,0,x,y,10);
      shade.addColorStop(0,'#f5fbff');shade.addColorStop(.29,color);shade.addColorStop(1,'#193650');
      ellipse(x,y,10,10,shade);
    };
    const arrow=(x,y,up,color)=>{
      const tip=y+(up?-26:25), neck=tip+(up?6:-6);
      path([[x,y+(up?-8:8)],[x,tip]],color,3);
      path([[x-4,neck],[x,tip],[x+4,neck]],color,2);
    };
    paint({red,blue,ice,subtle,text,path,ellipse,atom,arrow});
    context.restore();
  }

  function drawAltermagnet(width,height,t) {
    materialDiagram(width,height,({red,blue,ice,subtle,text,path,ellipse,atom,arrow})=>{
      const progress=(1-Math.cos(Math.min(t/4.6,1)*Math.PI))/2;
      path([[320,41],[320,367]],'#29435e');
      path([[22,187],[618,187]],'#29435e');
      text('PT-symmetric antiferromagnet',161,34,17,ice,'center',700);
      text('d-wave altermagnet',479,34,19,ice,'center',700);
      text('Real space · opposite moments cancel',320,63,14,subtle,'center');
      [161,479].forEach((cx,side)=>{
        const sites=[[cx-85,122],[cx-9,89],[cx+84,117],[cx+7,152]];
        path([...sites,sites[0]],'#b99055',2.4);
        sites.forEach(([x,y],i)=>{
          const up=i%2===0,color=up?red:blue;
          if(side){
            context.save();
            context.translate(x,y);
            // Two equivalent axes in the crystal plane, as seen in an oblique projection.
            context.rotate(up?-.37:1.03);
            for (const sign of [-1,1]) {
              const xLobe=sign*14, size=sign>0?15:12;
              const shade=context.createRadialGradient(xLobe-3,-3,0,xLobe,0,size);
              shade.addColorStop(0,up?'#ffd5ce':'#daefff');
              shade.addColorStop(.34,up?'#e78888':'#78a8f5');
              shade.addColorStop(1,up?'#6c334f':'#273e73');
              ellipse(xLobe,0,size,8,shade);
            }
            context.restore();
          }
          atom(x,y,color);
          arrow(x,y,up,color);
        });
      });
      text('Momentum space · Two cuts through Γ',320,211,14,subtle,'center');
      const drawBand=(cx,split)=>{
        const origin=327, edge=99;
        const at=(direction,s,spin)=>{
          const shift=split?direction*spin*64*s*s*(1-.56*s):0;
          return [cx+direction*edge*s,260+65*s*s+shift];
        };
        path([[cx,origin],[cx,226]],'#7894aa');
        path([[cx,origin],[cx-edge,350]],'#7894aa');
        path([[cx,origin],[cx+edge,350]],'#7894aa');
        text('E',cx,222,13,subtle,'center',700);
        text('kₓ',cx-edge-9,368,14,subtle,'center');
        text('kᵧ',cx+edge+9,368,14,subtle,'center');
        const goingRight=progress>=.5;
        const activeDirection=goingRight?1:-1;
        const fraction=Math.abs(progress*2-1);
        for(const [spin,color] of [[1,red],[-1,blue]]){
          for(const direction of [-1,1]){
            const points=Array.from({length:42},(_,j)=>at(direction,j/41,spin));
            path(points,split?color:spin>0?'#9fbada':'#c3d8ef',split?2.8:spin>0?4.6:2);
          }
          if(split){
            const point=at(activeDirection,fraction,spin);
            ellipse(point[0],point[1],4.8,4.8,color);
          }
        }
        if(!split){
          const point=at(activeDirection,fraction,1);
          ellipse(point[0],point[1],5,5,ice);
        }
      };
      drawBand(161,false);drawBand(479,true);
      text('Spin bands share the same energy',163,393,14,subtle,'center');
      text('Spin-band order reverses between kₓ and kᵧ',479,393,14,'#c5e5ff','center',700);
    });
  }

  function drawWeyl(width,height,t) {
    materialDiagram(width,height,({red,blue,ice,subtle,text,path,ellipse})=>{
      const phase=(1+Math.cos(t/4.8*tau))/2;
      const y=222,r=64,h=105;
      text('Inversion-related Weyl pair',320,38,23,ice,'center',700);
      text('Inversion preserved · Time reversal broken',320,65,15,subtle,'center');
      path([[86,y],[571,y],[563,y-5],[571,y],[563,y+5]],'#718caa',1.15);
      path([[85,350],[85,105],[80,113],[85,105],[90,113]],'#718caa',1.15);
      text('E',73,101,15,subtle,'left',700);
      text('k',581,y+5,15,subtle,'left',700);
      text('E₀',58,y+5,15,subtle);
      [211,429].forEach((x,index)=>{
        const colors=index?['#85cffa','#275386']:['#f49aaf','#743c69'];
        for(const sign of [-1,1]){
          const top=y+sign*h;
          const shade=context.createLinearGradient(x-r,0,x+r,0);
          shade.addColorStop(0,colors[1]);shade.addColorStop(.52,colors[0]);shade.addColorStop(1,colors[1]);
          context.beginPath();context.moveTo(x,y);context.lineTo(x-r,top);
          context.quadraticCurveTo(x,top+sign*23,x+r,top);context.closePath();
          context.fillStyle=shade;context.fill();
          ellipse(x,top,r,12,colors[1]);ellipse(x,top,r,12,colors[0],false);
          if(phase>.04)ellipse(x,y+sign*h*phase,r*phase,Math.max(1,11*phase),ice,false);
        }
        ellipse(x,y,4.4,4.4,ice);
        path([[x,y+8],[x,y+39]],'#adc6de',1.2);
        text(index?'+k₀':'−k₀',x,y+56,17,ice,'center',700);
        text(index?'Chirality +1':'Chirality −1',x,363,17,colors[0],'center',700);
      });
      text('Inversion maps k ↔ −k and reverses the topological charge.',320,395,15,subtle,'center');
    });
  }

  function materials(t) {
    const step=Math.min(2,Math.floor(t/4.8));
    if(step!==reportedStep) {
      reportedStep=step;
      onStep(step);
    }

    for(let row=0;row<2;row++) {
      const sign=row?-1:1, y=row?-.74:.70;
      annotate(row?'Wall center: points left':'Wall center: points right',[.15,y+.62,.22],row?pink:blue);
      line([-3.08,y,.23],[3.08,y,.23],'#385b77',1.3);
      for(let i=0;i<11;i++) {
        const x=-3.04+i*.608;
        const fraction=1/(1+Math.exp(-2.25*x));
        const theta=fraction*Math.PI;
        const middle=Math.abs(x)<.85;
        const color=middle?(row?pink:blue):x<0?'#86caff':'#f3a2b5';
        const length=middle ? .37+.11*Math.min(1,(t-4.8)/1.1) : .36;
        const point=[x,y,.28];
        sphere(point,.072,color);
        line(point,[x+sign*length*Math.sin(theta),y+length*Math.cos(theta),.28],color,middle?3.2:2.2,true);
      }
    }
    phaseLabel='Same domains  /  Opposite rotation through the wall';
  }

  function drawInference(width,height,pad,t) {
    const weights=[[1,-1,1],[-1,1,1],[1,1,-1]];
    const conditions=[[1,-1,1],[-1,1,1]];
    const inputs=conditions[t<9?0:1];
    const font=Math.max(11,Math.min(15,width*.032));
    const text=(label,x,y,color='#dceffc',align='left',max=width-2*pad)=>{
      context.textAlign=align;context.fillStyle=color;
      context.fillText(label,x,y,max);
      context.textAlign='left';
    };
    const line2=(a,b,color,stroke=1)=>{
      context.beginPath();context.moveTo(...a);context.lineTo(...b);
      context.strokeStyle=color;context.lineWidth=stroke;context.stroke();
    };
    const chip=(x,y,w,h,fill,border)=>{
      context.beginPath();context.roundRect(x,y,w,h,Math.min(7,h/4));
      context.fillStyle=fill;context.fill();context.strokeStyle=border;context.lineWidth=1;context.stroke();
    };
    const gold='#ffce87', cyan='#83ebff';
    const header=Math.max(15,Math.min(23,width*.045));
    context.font='700 '+header+'px Arial,sans-serif';
    text(t<4.8?'One MRAM compute cell':'MRAM dot products for AI inference',pad,pad+13);
    context.font='600 '+font+'px Arial,sans-serif';
    if(t<4.8) {
      const input=t<2.4?1:-1, y=height*.49;
      const left=width*.27,right=width*.73,w=width*.29,h=height*.19;
      text('Stored weight w = +1',width/2,height*.27,'#bed5e8','center');
      text('Input x = '+(input===1?'+1':'−1'),width/2,height*.38,gold,'center');
      for(const [x,selected,label] of [[left,input===1,'High resistance'],[right,input===-1,'Low resistance']]) {
        const color=selected?cyan:'#69839b';
        line2([width/2,y-15],[x,y],color,selected?2:1);
        chip(x-w/2,y,w,h,selected?'#164764':'#142d43',color);
        text(label,x,y+h*.59,selected?'#ebfaff':'#a1b7c8','center',w-8);
      }
      text(input===1?'Match: high R encodes +1':'Mismatch: low R encodes −1',width/2,height*.83,cyan,'center');
      text('Input selects one of two complementary MTJ paths',pad,height-pad);
      return;
    }
    const gridX=width*.36, dx=width*.235, top=height*.345, dy=height*.132;
    const cellW=Math.min(78,width*.175), cellH=height*.083;
    const outputY=height*.835, sensed=t%4.2>1.1;
    text('Input x',pad,top-16,'#bdd2e5');
    text('Stored weights w and selected MTJ paths',gridX-cellW/2,top-16,'#bdd2e5','left',width-gridX+cellW/2-pad);
    for(let col=0;col<3;col++){
      const x=gridX+col*dx;
      line2([x,top-5],[x,outputY-18],'#4e80a1',2);
      const score=inputs.reduce((sum,value,row)=>sum+value*weights[row][col],0);
      text(sensed?(score>0?'+':'')+String(score).replace('-','−'):'…',x,outputY,cyan,'center');
    }
    for(let row=0;row<3;row++){
      const y=top+row*dy, input=inputs[row];
      text(input===1?'+1':'−1',pad,y+cellH*.65,gold);
      line2([width*.13,y+cellH*.5],[gridX-cellW/2-5,y+cellH*.5],'#e9b76e',1.8);
      weights[row].forEach((weight,col)=>{
        const x=gridX+col*dx, match=input===weight;
        chip(x-cellW/2,y,cellW,cellH,match?'#174c69':'#203447',match?'#88d5ec':'#638098');
        text((weight===1?'+1':'−1')+' / '+(match?'high R':'low R'),x,y+cellH*.68,'#e6f7ff','center',cellW-6);
      });
    }
    text('Dot product',pad,outputY,'#bdd2e5','left',width*.25);
    text('Series resistance sum → sensed dot product',pad,height-pad,'#bdd2e5');
  }

  const renderers=[switching,null,null,stochastic,materials];
  const cutEdges=[[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5],[0,5]];
  const cutScore=bits=>cutEdges.reduce((sum,[a,b])=>sum+Number(bits[a]!==bits[b]),0);
  const maxCut=Math.max(...Array.from({length:64},(_,mask)=>cutScore(Array.from({length:6},(_,i)=>(mask>>i)&1))));
  let networkBits=[0,1,0,1,0,1], bestBits=[...networkBits], networkBatch=-1, networkCycle=-1;

  function drawNetwork(width,height,pad,t) {
    const cycle=Math.floor(t/17);
    const phase=t%17;
    const batch=Math.floor(phase*8);
    if(cycle!==networkCycle){
      networkBits=Array.from({length:6},()=>Math.random()<.5?0:1);
      bestBits=[...networkBits];
      networkBatch=-1;
      networkCycle=cycle;
    }
    let active=-1;
    if(phase<13.3){
      active=(batch*5+Math.floor(batch/6))%6;
      if(batch!==networkBatch){
        const votes=cutEdges.filter(edge=>edge.includes(active)).reduce((sum,[a,b])=>sum+(networkBits[a===active?b:a]===0?1:-1),0);
        const inverseTemperature=.35+Math.min(1,phase/11)*1.3;
        networkBits[active]=Math.random()<1/(1+Math.exp(-inverseTemperature*votes))?1:0;
        if(cutScore(networkBits)>cutScore(bestBits)) bestBits=[...networkBits];
        networkBatch=batch;
      }
    }
    const ink='#e1f3ff', muted='#b6cee0', cyan='#80dbf6', rose='#f8a0c9', gold='#ffce85';
    const simple=width<445;
    const font=Math.max(11,Math.min(15,width*.030));
    const heading=Math.max(15,Math.min(22,width*.041));
    const text=(label,x,y,color=ink,align='left',max=width-2*pad)=>{
      context.fillStyle=color;context.textAlign=align;context.fillText(label,x,y,max);context.textAlign='left';
    };
    const paintGraph=(bits,center,radius,highlight)=>{
      const points=bits.map((_,i)=>{const angle=-Math.PI/2+i*tau/6;return [center+Math.cos(angle)*radius,height*.51+Math.sin(angle)*radius*.75];});
      cutEdges.forEach(([a,b])=>{
        const isCut=bits[a]!==bits[b];
        context.beginPath();context.moveTo(...points[a]);context.lineTo(...points[b]);
        context.strokeStyle=isCut?'#76c8d4':'#40576d';context.lineWidth=isCut?2:1;context.stroke();
      });
      points.forEach(([x,y],i)=>{
        const r=Math.min(15,Math.max(8,width*.027));
        const color=bits[i]?rose:cyan;
        context.beginPath();context.arc(x,y,r,0,tau);
        context.fillStyle=bits[i]?'#6b3559':'#245879';context.fill();
        context.strokeStyle=i===highlight?gold:color;context.lineWidth=i===highlight?2.7:1.25;context.stroke();
        text(String(bits[i]),x,y+font*.34,color,'center');
      });
    };
    context.font='700 '+heading+'px Arial,sans-serif';
    text('p-bit network optimization',pad,pad+12);
    context.font='600 '+font+'px Arial,sans-serif';
    text('Current',width*.25,height*.24,muted,'center');
    text('Best found',width*.75,height*.24,muted,'center');
    const radius=Math.min(width*.16,height*.24);
    paintGraph(networkBits,width*.25,radius,active);
    paintGraph(bestBits,width*.75,radius,-1);
    const score=cutScore(networkBits), best=cutScore(bestBits);
    text(score+' / '+cutEdges.length+' cut edges',width*.25,height*.79,ink,'center');
    text(best+' / '+cutEdges.length+' cut edges',width*.75,height*.79,best===maxCut?gold:ink,'center');
    const status=phase<5?'Exploring combinations':phase<13.3?'Favoring higher scores':best===maxCut?'Optimal score reached':'Best candidate from this run';
    text(status+(!simple?'  ·  Goal: cut as many edges as possible':''),pad,height-pad,muted);
  }

  function draw() {
    const width=canvas.clientWidth, height=canvas.clientHeight;
    if(!width||!height) return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const pixelWidth=Math.round(width*ratio), pixelHeight=Math.round(height*ratio);
    if(canvas.width!==pixelWidth||canvas.height!==pixelHeight) {
      canvas.width=pixelWidth; canvas.height=pixelHeight;
    }
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,width,height);
    if(scene===4 && time<9.6){
      const step=time<4.8?0:1;
      if(step!==reportedStep){reportedStep=step;onStep(step);}
      if(step===0) drawAltermagnet(width,height,time);
      else drawWeyl(width,height,time-4.8);
      return;
    }
    if(scene===1){drawInterconversion(width,height,time);return;}
    if(scene===5){drawNetwork(width,height,Math.max(12,width*.045),time);return;}
    if(scene===2){drawInference(width,height,Math.max(12,width*.045),time);return;}
    const [yaw,pitch,span]=cameras[scene];
    camera={width,height,unit:Math.min(width/span,height/(scene===0?5.4:4.6)),yaw,pitch};
    shapes=[]; tags=[]; phaseLabel='';
    if(scene!==0){
      const gridColor=scene===4?'#26446175':'#264461';
      for(let i=-4;i<=4;i++){
        line([i,-1.16,-2.6],[i,-1.16,2.6],gridColor,1);
        line([-4,-1.16,i*.65],[4,-1.16,i*.65],gridColor,1);
      }
    }
    renderers[scene](time);
    shapes.sort((a,b)=>a.depth-b.depth).forEach(({draw})=>draw());
    const pad=Math.max(12,width*.045);
    context.fillStyle='#e8f5ff';
    context.font='700 '+Math.min(23,width*.052)+'px Arial,sans-serif';
    if (scene===0) switchingLegend(width,height,pad,time);
    const sceneTitle=scene===4 && time>=9.6?'Néel domain walls':scene===4 && time>=4.8?'Weyl band crossings':labels[scene][0];
    if (sceneTitle) context.fillText(sceneTitle,pad,pad+12);
    context.fillStyle=scene===0?'#344d64':'#bccee4';
    context.font='500 '+Math.max(10,Math.min(14,width*.033))+'px system-ui,sans-serif';
    context.fillText(phaseLabel || labels[scene][1],pad,height-pad,width-2*pad);
    tags.forEach(([label,color,x=pad,y=height-pad-21,align='left'])=>{
      context.textAlign=align;
      context.fillStyle=color;
      context.fillText(label,x,y);
    });
    context.textAlign='left';
    if(scene===3) {
      drawLandscape(width,height,pad);
      drawTrace(width,height,pad);
    }
  }

  function drawLandscape(width,height,pad) {
    const left=width*.49,right=width-pad,top=height*.235,bottom=height*.48;
    const x0=left+11,x1=right-9;
    const center=(x0+x1)/2, span=(x1-x0)/2;
    const energy = x => .90*(x*x-.53)**2-.092*bias*x;
    const toY = value => bottom-17-value*(bottom-top)*1.65;
    context.fillStyle='#0c263c';context.fillRect(left,top,right-left,bottom-top);
    context.strokeStyle='#345470';context.lineWidth=1;
    context.beginPath();
    context.moveTo(center,top+5);context.lineTo(center,bottom-7);context.stroke();
    context.beginPath();
    for(let i=0;i<=50;i++) {
      const x=-1.05+2.10*i/50;
      const px=center+x*span/1.05,py=toY(energy(x));
      if(i===0) context.moveTo(px,py); else context.lineTo(px,py);
    }
    context.strokeStyle='#f7c681';context.lineWidth=2;context.stroke();
    const state=recent.at(-1);
    const marker=state?.75:-.75;
    context.fillStyle=state?pink:blue;
    context.beginPath();context.arc(center+marker*span/1.05,toY(energy(marker)),4,0,tau);context.fill();
    context.fillStyle='#d5eef4';
    context.fillText('Energy landscape',left,top-10,right-left);
    context.fillText('0',center-span*.72-4,bottom-1);
    context.fillText('1',center+span*.72-4,bottom-1);
    context.fillText(biasLabel,left,bottom+14,right-left);
  }

  function drawTrace(width,height,pad) {
    const left=width*.49,right=width-pad,top=height*.595,bottom=height*.81;
    const x0=left+20, x1=right-12, hi=top+9, lo=bottom-8;
    const dx=(x1-x0)/32;
    context.fillStyle='#0d283f'; context.fillRect(left,top,right-left,bottom-top);
    context.strokeStyle='#35627e'; context.lineWidth=1;
    for (const y of [hi,lo]) {
      context.beginPath();context.moveTo(x0,y);context.lineTo(x1,y);context.stroke();
    }
    context.fillStyle='#d5eef4';context.fillText('Output trace',left,top-4,right-left);
    context.fillText('1',left+7,hi+4);context.fillText('0',left+7,lo+4);
    context.beginPath();
    recent.forEach((value,i)=>{
      const x=x0+i*dx, y=value?hi:lo;
      if(i===0) context.moveTo(x,y); else context.lineTo(x,y);
      context.lineTo(x+dx,y);
    });
    context.strokeStyle='#83f4f6';
    context.lineWidth=2.5;
    context.stroke();
    const ones=recent.filter(Boolean).length;
    context.fillStyle='#d5eef4';
    context.fillText('1s in window: '+ones+' / '+recent.length,left,bottom+14,right-left);
  }

  function animate(timestamp) {
    if(!running) return;
    if(previous!==undefined) {
      time+=Math.min((timestamp-previous)/1000,.05);
      if(scene!==3 && scene!==5 && time>=duration) time%=duration;
    }
    previous=timestamp;
    draw();
    frame=requestAnimationFrame(animate);
  }

  function setPlaying(value) {
    if(value===running) return;
    running=value;
    previous=undefined;
    if(running) frame=requestAnimationFrame(animate);
    else cancelAnimationFrame(frame);
  }

  function reset() {
    setPlaying(false);
    time = 0;
    bits = [];
    recent = [];
    lastSample = -1;
    reportedStep = -1;
  }

  function seek(seconds) {
    setPlaying(false);
    time = clamp(seconds,0,duration);
    draw();
  }

  return {draw,setPlaying,reset,seek};
}

