'use client';

import { useId, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import type { QuestionVisualization } from '@/lib/visualization-schema';
import { binomialMass, triangleHypotenuse } from '@/lib/visualization-schema';
import { dopplerPitchLabel, getVisualCheckpoints, moleculeDiagramPoints, phaseForStep } from '@/lib/step-visualization';

type Props = {
  model: QuestionVisualization;
  stepIndex: number;
  stepCount: number;
  isVerification: boolean;
  onSelectStep: (index: number) => void;
};

const BLUE = '#B6CAEB';
const YELLOW = '#F7D66E';
const PINK = '#FFB2DD';
const GREEN = '#A8D38B';
const INK = '#F8F3E7';

function Label({ x, y, children, color = INK, size = 13 }: {
  x: number; y: number; children: ReactNode; color?: string; size?: number;
}) {
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight="650" textAnchor="middle">{children}</text>;
}

/** All geometry comes from bounded, typed numerical data, never model-authored markup. */
function VisualScene({ model, phase }: { model: QuestionVisualization; phase: 0 | 1 | 2 | 3 }) {
  const reveal = (at: number) => phase >= at;
  let drawing: ReactNode;

  switch (model.type) {
    case 'quadratic': {
      const h = -model.b / (2 * model.a);
      const k = model.a*h*h + model.b*h + model.c;
      const delta = model.b*model.b - 4*model.a*model.c;
      const fx = (x: number) => model.a*x*x+model.b*x+model.c;
      const px = (x: number) => 260+(x-h)*29;
      const py = (y: number) => 110-(y-k)*8;
      const path = Array.from({length:151},(_,i)=>{
        const x=h-7.5+i*0.1;
        return (i?'L':'M')+px(x).toFixed(2)+','+py(fx(x)).toFixed(2);
      }).join(' ');
      const root = Math.sqrt(Math.max(0,delta));
      const roots = delta>=0?[(-model.b-root)/(2*model.a),(-model.b+root)/(2*model.a)]:[];
      drawing = <>
        <line x1="26" x2="495" y1={py(0)} y2={py(0)} stroke="#666C75" strokeWidth="1.5" />
        <line x1={px(0)} x2={px(0)} y1="12" y2="208" stroke="#666C75" strokeWidth="1.5" />
        <path d={path} fill="none" stroke={BLUE} strokeWidth="3" />
        {reveal(1)&&<><line x1={px(h)} x2={px(h)} y1="15" y2="208" stroke={PINK} strokeDasharray="5 6" />
          <circle cx={px(h)} cy={py(k)} r="6.5" fill={PINK} /><Label x={px(h)} y={Math.max(24,py(k)-15)} color={PINK}>Vertex</Label></>}
        {reveal(2)&&roots.map((x,i)=><circle key={i} cx={px(x)} cy={py(0)} r="6" fill={YELLOW} stroke="#292C2F" strokeWidth="2"/>)}
        {reveal(3)&&<Label x={411} y={31} color={YELLOW}>Δ = {Number(delta.toFixed(2))}</Label>}
      </>;
      break;
    }
    case 'linear': {
      const {slope,intercept} = model;
      const value = (x:number)=>intercept + x*slope;
      // Center the displayed graph around the intercept so large absolute
      // y-values stay visible.
      const px=(x:number)=>260+x*30;
      const py=(y:number)=>110-(y-intercept)*Math.min(18,80/Math.max(1,Math.abs(slope)));
      drawing = <>
        <path d="M25 110H495 M260 18V205" stroke="#666C75" strokeWidth="1.5"/>
        <path d={'M'+px(-7)+','+py(value(-7))+' L'+px(7)+','+py(value(7))}
          stroke={BLUE} strokeWidth="3" fill="none"/>
        {reveal(1)&&<circle cx={260} cy={py(intercept)} r="7" fill={PINK}/>}
        {reveal(2)&&<><line x1={px(1)} x2={px(1)} y1={py(intercept)} y2={py(value(1))} stroke={YELLOW} strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx={px(1)} cy={py(value(1))} r="6" fill={YELLOW}/></>}
        {reveal(3)&&<Label x={402} y={31} color={GREEN}>m = {slope}</Label>}
        <Label x={260} y={222} size={11} color="#BDC4D1">Input</Label>
      </>;
      break;
    }
    case 'trigonometry': {
      const a=model.angleDegrees*Math.PI/180;
      const x=245+Math.cos(a)*78,y=112-Math.sin(a)*78;
      const v=model.function==='cos'?Math.cos(a):Math.sin(a);
      drawing = <>
        <circle cx="245" cy="112" r="78" stroke={BLUE} strokeWidth="2.5" fill="none"/>
        <path d="M145 112H345 M245 13V207" stroke="#666C75" strokeWidth="1.5"/>
        <path d={'M245 112 L'+x+' '+y} stroke={PINK} strokeWidth="3" />
        <circle cx={x} cy={y} r="7" fill={PINK}/>
        {reveal(1)&&<Label x={245} y={21} color={BLUE}>Unit circle</Label>}
        {reveal(2)&&<><path d={'M'+x+' '+y+' L'+(model.function==='cos'?x:245)+' '+(model.function==='cos'?112:y)} stroke={YELLOW} strokeWidth="3" strokeDasharray="4 5"/>
          <Label x={405} y={99} color={YELLOW}>{model.function} θ</Label>
          <Label x={405} y={124} color={INK}>{Number(v.toFixed(3))}</Label></>}
        {reveal(3)&&<Label x={405} y={160} color={GREEN}>θ = {model.angleDegrees}°</Label>}
      </>;
      break;
    }
    case 'atom': {
      const count=model.atomicNumber, inner=Math.min(2,count), outer=count-inner;
      drawing = <>
        <circle cx="260" cy="112" r="27" fill={PINK} fillOpacity=".3" stroke={PINK} strokeWidth="2"/>
        <Label x={260} y={119} color={INK}>+{count}</Label>
        {reveal(1)&&<ellipse cx="260" cy="112" rx="63" ry="40" fill="none" stroke={GREEN} strokeWidth="2" />}
        {reveal(2)&&<ellipse cx="260" cy="112" rx="125" ry="82" fill="none" stroke={BLUE} strokeWidth="2"/>}
        {reveal(1)&&Array.from({length:inner},(_,i)=>{
          const angle=2*Math.PI*i/inner;
          return <circle key={'a'+i} cx={260+63*Math.cos(angle)} cy={112+40*Math.sin(angle)} r="6" fill={GREEN}/>;
        })}
        {reveal(2)&&Array.from({length:outer},(_,i)=>{
          const angle=2*Math.PI*i/outer;
          return <circle key={'b'+i} cx={260+125*Math.cos(angle)} cy={112+82*Math.sin(angle)} r="6" fill={BLUE}/>;
        })}
        {reveal(3)&&<Label x={431} y={41} color={YELLOW}>{count} e⁻</Label>}
      </>;
      break;
    }
    case 'doppler': {
      const approaching=model.direction==='toward';
      const ratio=model.sourceSpeed/model.speedOfSound;
      drawing = <>
        {reveal(1)&&Array.from({length:5},(_,i)=>(
          <circle key={i} cx={approaching?175+i*7:175-i*7} cy="111"
            r={22+i*27} stroke={BLUE} strokeWidth="2" strokeOpacity={0.75-i*0.11} fill="none" />
        ))}
        <circle cx="175" cy="111" r="18" fill={PINK}/><Label x={175} y={116} color="#25272C">S</Label>
        <circle cx="430" cy="111" r="18" fill={GREEN}/><Label x={430} y={116} color="#25272C">L</Label>
        <Label x={175} y={157} color={INK} size={12}>Source</Label>
        <Label x={430} y={157} color={INK} size={12}>Listener</Label>
        {reveal(2)&&<><path d={approaching?'M225 186 H371 l-12 -8 M371 186 l-12 8':'M371 186 H225 l12 -8 M225 186 l12 8'} stroke={YELLOW} strokeWidth="2.5" fill="none"/>
          <Label x={302} y={210} color={YELLOW} size={12}>{approaching?'Approaching':'Receding'} · vₛ/v={Number(ratio.toFixed(2))}</Label></>}
        {reveal(3)&&<Label x={405} y={32} color={GREEN}>{dopplerPitchLabel(model.sourceSpeed, model.direction)}</Label>}
      </>;
      break;
    }
    case 'right_triangle': {
      const scale=145/Math.max(model.legA,model.legB);
      const bx=182+model.legA*scale,cy=185-model.legB*scale;
      drawing = <>
        <path d={'M182 185 L'+bx+' 185 L182 '+cy+'Z'} fill={BLUE} fillOpacity=".12" stroke={BLUE} strokeWidth="3"/>
        <path d="M200 185 V167 H182" fill="none" stroke={PINK} strokeWidth="2"/>
        <Label x={(bx+182)/2} y={208}>{model.legA} cm</Label>
        <Label x={135} y={(cy+185)/2}>{model.legB} cm</Label>
        {reveal(1)&&<path d={'M'+bx+' 185 L182 '+cy} stroke={YELLOW} strokeWidth="4"/>}
        {reveal(2)&&<Label x={(bx+182)/2+42} y={(cy+185)/2} color={YELLOW}>
          c = {Number(triangleHypotenuse(model.legA,model.legB).toFixed(2))}
        </Label>}
        {reveal(3)&&<Label x={412} y={36} color={GREEN}>Area</Label>}
        {reveal(3)&&<Label x={412} y={57} color={GREEN}>{Number((model.legA*model.legB/2).toFixed(2))} cm²</Label>}
      </>;
      break;
    }
    case 'forces': {
      const length=(n:number)=>32+Math.min(108,n/500*108);
      const net=model.appliedForce-model.frictionForce;
      drawing = <>
        <path d="M35 175 H485" stroke="#666C75" strokeWidth="2"/>
        <rect x="212" y="105" width="88" height="70" rx="11" fill={BLUE} fillOpacity=".18" stroke={BLUE} strokeWidth="2"/>
        <Label x={256} y={146}>{model.mass} kg</Label>
        <path d={'M302 137 H'+(302+length(model.appliedForce))+' l-12 -7 M'+(302+length(model.appliedForce))+' 137 l-12 7'} stroke={BLUE} fill="none" strokeWidth="3"/>
        <Label x={380} y={111} color={BLUE}>{model.appliedForce} N</Label>
        {reveal(1)&&<><path d={'M210 137 H'+(210-length(model.frictionForce))+' l12 -7 M'+(210-length(model.frictionForce))+' 137 l12 7'} stroke={PINK} fill="none" strokeWidth="3"/>
          <Label x={125} y={111} color={PINK}>{model.frictionForce} N</Label></>}
        {reveal(2)&&<Label x={259} y={55} color={YELLOW}>ΣF = {Number(net.toFixed(2))} N</Label>}
        {reveal(3)&&<Label x={259} y={80} color={GREEN}>a = {Number((net/model.mass).toFixed(2))} m/s²</Label>}
      </>;
      break;
    }
    case 'binomial': {
      const {trials,probability}=model;
      const heights=Array.from({length:trials+1},(_,i)=>binomialMass(trials,probability,i));
      const max=Math.max(...heights,0.01);
      const mode=Math.min(trials,Math.floor((trials+1)*probability));
      const bw=424/(trials+1);
      drawing = <>
        <path d="M45 190H477" stroke="#74777D" strokeWidth="1.5"/>
        {reveal(1)&&heights.map((p,i)=>{
          const h=p/max*134;
          return <rect key={i} x={48+i*bw} y={190-h} width={Math.max(2,bw-3)} height={h} rx="2"
            fill={i===mode && reveal(2)?PINK:BLUE} opacity={i===mode && reveal(2)?1:.65}/>;
        })}
        <Label x={260} y={214} color={INK} size={11}>k successes (0…{trials})</Label>
        {reveal(2)&&<Label x={410} y={29} color={PINK}>mode = {mode}</Label>}
        {reveal(3)&&<Label x={410} y={52} color={GREEN}>Variance = {Number((trials*probability*(1-probability)).toFixed(2))}</Label>}
        {!reveal(1)&&<Label x={260} y={101} color={YELLOW}>n = {trials} · p = {probability}</Label>}
      </>;
      break;
    }
    case 'molecule': {
      const water=model.formula==='H2O';
      const atoms=moleculeDiagramPoints(model.formula);
      drawing = <>
        {reveal(1)&&atoms.map(([x,y],i)=>water
          ? <path key={i} d={'M260 136 L'+x+' '+y} stroke={YELLOW} strokeWidth="8" />
          : <g key={i}><path d={'M260 105 L'+x+' '+(y-7)+' M260 119 L'+x+' '+(y+7)} stroke={YELLOW} strokeWidth="4" /></g>
        )}
        {atoms.map(([x,y],i)=><g key={'atom'+i}><circle cx={x} cy={y} r="23" fill={water?BLUE:PINK}/>
          <Label x={x} y={y+5} color="#222427">{water?'H':'O'}</Label></g>)}
        <circle cx="260" cy="112" r="32" fill={water?PINK:BLUE}/>
        <Label x={260} y={119} color="#222427" size={20}>{water?'O':'C'}</Label>
        {reveal(2)&&<Label x={410} y={45} color={GREEN}>{water?'Bent':'Linear'}</Label>}
        {reveal(3)&&<Label x={412} y={71} color={YELLOW}>{water?'≈ 104.5°':'180°'}</Label>}
      </>;
      break;
    }
  }

  return (
    <svg className="block h-auto w-full min-w-[420px] overflow-hidden" viewBox="0 0 520 225" aria-hidden="true" focusable="false">
      <rect width="520" height="225" rx="16" fill="#20252D"/>
      <g>{drawing}</g>
    </svg>
  );
}

export function StepVisualJourney({
  model, stepIndex, stepCount, isVerification, onSelectStep,
}: Props) {
  const reduceMotion=useReducedMotion();
  const index=Math.max(0,Math.min(Math.max(0,stepCount-1),stepIndex));
  const phase=phaseForStep(index,isVerification,stepCount);
  const checkpoints=getVisualCheckpoints(model);
  const checkpoint=checkpoints[phase];
  const titleId=useId();
  const statusId=useId();
  const canPrevious=index>0;
  const canNext=index<stepCount-1;
  const visibleCount=Math.min(stepCount,9);
  const visibleStart=Math.max(0,Math.min(index-4,stepCount-visibleCount));
  const visibleIndices=Array.from({length:visibleCount},(_,i)=>visibleStart+i);

  return (
    <section aria-labelledby={titleId} aria-describedby={statusId} className="min-w-0 rounded-2xl border border-white/20 bg-[#24282D] p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#F7D66E]">
          <Eye aria-hidden="true" size={15}/>
          <span id={titleId}>Visual checkpoints</span>
        </div>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-bold text-[#C3D9FC]">
          Step {index+1} of {stepCount}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {checkpoints.map((_,i)=><span key={i} className="h-1 flex-1 rounded-full" style={{
          backgroundColor:i<=phase?YELLOW:'rgba(255,255,255,0.16)'
        }}/>)}
      </div>
      <div role="group" aria-label="Jump to explanation step"
        className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">
        {visibleIndices.map((target) => (
          <button type="button" key={target} aria-label={'Show explanation step ' + (target+1)}
            aria-current={target===index ? 'step' : undefined}
            onClick={()=>onSelectStep(target)}
            className={'min-h-11 min-w-11 shrink-0 rounded-xl border text-xs font-extrabold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F7D66E] ' +
              (target===index ? 'border-[#F7D66E] bg-[#F7D66E] text-[#25272C]' : 'border-white/20 bg-white/5 text-white')}>
            {target+1}
          </button>
        ))}
      </div>
      <p id={statusId} className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Step {index+1} of {stepCount}. {checkpoint.title}. {checkpoint.metric}.
      </p>
      <motion.div key={model.type+'-'+phase} initial={reduceMotion?false:{opacity:.5,y:7}}
        animate={{opacity:1,y:0}} transition={reduceMotion?{duration:0}:{duration:.22}}>
        <div className="tutor-visual-scroll overflow-x-auto rounded-2xl focus-visible:outline-3 focus-visible:outline-[#F7D66E]" aria-label="Diagram viewport: swipe or scroll sideways to inspect on a narrow screen" role="region" tabIndex={0}>
          <VisualScene model={model} phase={phase}/>
        </div>
        <p className="text-[11px] leading-snug text-[#CFD4DD] sm:hidden">Swipe across the diagram to inspect the full illustration.</p>
        <div className="space-y-1.5 pt-2.5">
          <p className="text-[13px] font-extrabold text-white">{checkpoint.title}</p>
          <p className="text-xs leading-relaxed text-[#CFD4DD]">{checkpoint.detail}</p>
          <p className="rounded-lg border border-[#F7D66E]/35 bg-[#F7D66E]/10 px-3 py-2 font-mono-code text-xs font-bold text-[#F7D66E] break-words">
            {checkpoint.metric}
          </p>
        </div>
      </motion.div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous explanation step" disabled={!canPrevious} onClick={()=>onSelectStep(index-1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-3 focus-visible:outline-[#F7D66E]">
          <ArrowLeft size={14}/> Previous
        </button>
        <button type="button" aria-label="Next explanation step" disabled={!canNext} onClick={()=>onSelectStep(index+1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#F7D66E] px-3 py-2 text-xs font-extrabold text-[#202225] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-3 focus-visible:outline-white">
          Next step <ArrowRight size={14}/>
        </button>
      </div>
      <div className="flex items-start gap-2 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-[#BFC7D4]">
        <ShieldCheck size={14} className="shrink-0 text-[#A8D38B]" aria-hidden="true"/>
        <span>Computed from this question’s validated parameters. The visual checkpoints illustrate maths and science concepts; they do not independently verify AI-written reasoning.</span>
      </div>
    </section>
  );
}
