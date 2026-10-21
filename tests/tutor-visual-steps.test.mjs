import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTutorStepsIntoCards } from '../lib/tutor-step-parser.ts';
import { getVisualCheckpoints, phaseForStep, moleculeDiagramPoints, dopplerPitchLabel } from '../lib/step-visualization.ts';
import { validateVisualization } from '../lib/visualization-schema.ts';

test('numbered steps retain multiple paragraphs and a later verification card',()=>{
  const text = [
    'Step 1: Write down the formula.',
    '',
    'The formula is $F=ma$.',
    'Step 2: Substitute the given numbers.',
    '',
    '$20=5a$.',
    'Step 3: Solve for a.',
    'Verification: $5(4)=20$.',
  ].join('\n');
  const cards=parseTutorStepsIntoCards(text);
  assert.equal(cards.length,4);
  assert.equal(cards[0].body,'Write down the formula.\n\nThe formula is $F=ma$.');
  assert.equal(cards[1].body,'Substitute the given numbers.\n\n$20=5a$.');
  assert.equal(cards[3].isVerification,true);
  assert.equal(cards[0].id,'step-0-step-1');
  assert.equal(cards[0].badge,'01');
});

test('step identity persists while the tutor streams more content',()=>{
  const a=parseTutorStepsIntoCards('Step 1: First part');
  const b=parseTutorStepsIntoCards('Step 1: First part and extra details');
  assert.equal(a[0].id,b[0].id);
  assert.equal(b[0].body,'First part and extra details');
});

test('fallback paragraphs remain navigable when AI omits numbered headings',()=>{
  const cards=parseTutorStepsIntoCards('First paragraph.\n\nSecond paragraph.');
  assert.equal(cards.length,2);
  assert.equal(cards[0].title,'Step 1');
  assert.equal(cards[1].title,'Step 2');
  assert.deepEqual(parseTutorStepsIntoCards('  '),[]);
});

test('visual stage mapping does not trust arbitrary AI step text',()=>{
  assert.equal(phaseForStep(0,false),0);
  assert.equal(phaseForStep(1,false),1);
  assert.equal(phaseForStep(2,false),2);
  assert.equal(phaseForStep(21,false),3);
  assert.equal(phaseForStep(2,true),3);
  assert.equal(phaseForStep(-1,false),0);
  assert.equal(phaseForStep(NaN,false),0);
});

test('verified question coefficients produce four correct quadratic checkpoints',()=>{
  const model=validateVisualization({type:'quadratic',a:1,b:-6,c:13});
  assert.ok(model);
  const s=getVisualCheckpoints(model);
  assert.equal(s.length,4);
  assert.match(s[1].metric,/Vertex \(3, 4\)/);
  assert.match(s[2].metric,/Δ = -16/);
  assert.match(s[3].metric,/No real roots/);
});

test('force and geometry models preserve units and physical quantities',()=>{
  const force=validateVisualization({type:'forces',mass:5,appliedForce:30,frictionForce:10});
  const triangle=validateVisualization({type:'right_triangle',legA:6,legB:8,unit:'cm'});
  assert.ok(force);
  assert.ok(triangle);
  assert.match(getVisualCheckpoints(force)[2].metric,/4 m\/s²/);
  assert.match(getVisualCheckpoints(triangle)[2].metric,/10 cm/);
  assert.match(getVisualCheckpoints(triangle)[3].metric,/24 cm²/);
});

test('model checkpoints remain independent from streamed prose',()=>{
  const model=validateVisualization({type:'linear',slope:4.5,intercept:18,variable:'t'});
  assert.ok(model);
  const stages=getVisualCheckpoints(model);
  assert.match(stages[1].metric,/18/);
  assert.match(stages[2].metric,/22\.5/);
  // Unknown or contradictory AI steps are never evaluated by this module.
  const cards=parseTutorStepsIntoCards('Step 1: Please evaluate evil().');
  assert.equal(cards.length,1);
  assert.equal(getVisualCheckpoints(model)[2].metric,stages[2].metric);
});

test('all supported verified models produce four safe nonempty checkpoints',()=>{
  const models=[
    {type:'quadratic',a:1,b:-6,c:13},
    {type:'linear',slope:4.5,intercept:18,variable:'t'},
    {type:'trigonometry',function:'cos',angleDegrees:60},
    {type:'atom',atomicNumber:6},
    {type:'doppler',speedOfSound:340,sourceSpeed:30,emittedFrequency:850,direction:'toward'},
    {type:'right_triangle',legA:6,legB:8,unit:'cm'},
    {type:'forces',mass:5,appliedForce:30,frictionForce:10},
    {type:'binomial',trials:10,probability:0.3},
    {type:'molecule',formula:'H2O'},
  ];
  for (const raw of models) {
    const model=validateVisualization(raw);
    assert.ok(model,raw.type);
    const checkpoints=getVisualCheckpoints(model);
    assert.equal(checkpoints.length,4,raw.type);
    for(const step of checkpoints) {
      assert.ok(step.title.trim().length>0,raw.type);
      assert.ok(step.detail.trim().length>0,raw.type);
      assert.ok(step.metric.trim().length>0,raw.type);
      assert.ok(!step.metric.includes('NaN'),raw.type);
      assert.ok(!step.metric.includes('Infinity'),raw.type);
    }
  }
});


test('final explanation step shows full model without a verification card',()=>{
  assert.equal(phaseForStep(0,false,3),0);
  assert.equal(phaseForStep(1,false,3),2);
  assert.equal(phaseForStep(2,false,3),3);
  assert.equal(phaseForStep(3,false,4),3);
  assert.equal(phaseForStep(3,true,4),3);
  assert.equal(phaseForStep(1,false,4),1);
  assert.equal(phaseForStep(4,false,5),3);
  assert.equal(phaseForStep(2,false,5),2);
  assert.equal(phaseForStep(0,false,1),0);
  assert.equal(phaseForStep(99,false,1),0);
  assert.equal(phaseForStep(Infinity,false,4),0);
});

test('the illustrated water bond angle is 104.5 degrees',()=>{
  const [[x1,y1],[x2,y2]]=moleculeDiagramPoints('H2O');
  const ux=x1-260,uy=y1-112,vx=x2-260,vy=y2-112;
  const dot=ux*vx+uy*vy;
  const cross=ux*vy-uy*vx;
  const angle=Math.atan2(Math.abs(cross),dot)*180/Math.PI;
  assert.ok(Math.abs(angle-104.5)<1e-8);
  const [[a,b],[c,d]]=moleculeDiagramPoints('CO2');
  assert.equal(b,d);
  assert.ok(a<260&&c>260);
});

test('stationary Doppler sources do not imply a frequency shift',()=>{
  assert.equal(dopplerPitchLabel(0,'toward'),'Same pitch');
  assert.equal(dopplerPitchLabel(0,'away'),'Same pitch');
  assert.equal(dopplerPitchLabel(30,'toward'),'↑ pitch');
  assert.equal(dopplerPitchLabel(30,'away'),'↓ pitch');
});
