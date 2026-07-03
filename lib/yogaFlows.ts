export type YogaStep = {
  pose: string;
  duration: string; // display label, e.g. "30 sec" or "45 sec each side"
  cue: string;       // how to do it / what it's for
  image?: string;
};

export type YogaFlow = {
  id: string;
  name: string;
  durationLabel: string;
  durationMins: number;
  intensity: "gentle" | "moderate" | "power";
  met: number; // metabolic equivalent, used to estimate calorie burn
  description: string;
  steps: YogaStep[];
};

const IMG = {
  catCow: "https://upload.wikimedia.org/wikipedia/commons/b/be/Yoga_at_Your_Park_-_Bitilasana.jpg",
  downDog: "https://upload.wikimedia.org/wikipedia/commons/5/57/Downward-Facing-Dog.JPG",
  lowLunge: "https://upload.wikimedia.org/wikipedia/commons/5/5c/J%C3%B3ga_Anjaneyasana.jpg",
  standingFold: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Fb1.jpg",
  mountain: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Mr-yoga-mountain-pose-2.jpg",
  seatedFold: "https://upload.wikimedia.org/wikipedia/commons/6/66/Paschimotanasana_Yoga-Asana_Nina-Mel.jpg",
  childsPose: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Balasana.JPG",
  supineTwist: "https://upload.wikimedia.org/wikipedia/commons/5/55/Waist_Rotating_Pose.jpg",
  pigeon: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Yoga_shaktipat_rajakapotasana_by_alexey_baykov.jpg",
  butterfly: "https://upload.wikimedia.org/wikipedia/commons/6/64/Baddha_konasana.jpg",
  sphinx: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Salambhabhujangasana.png",
  legsUpWall: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Viparita-Karani_Yoga-Asana_Nina-Mel.jpg",
  seatedTwist: "https://upload.wikimedia.org/wikipedia/commons/1/13/Paripuna_Matsyendrasana_-_Full_lord_of_the_fish_pose.jpg",
  warrior1: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Virabhadrasana_I_-_Warrior_Pose_I.jpg",
  warrior2: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Virabhadrasana_II_-_Warrior_II_Pose.jpg",
  triangle: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Trikonasana_Yoga-Asana_Nina-Mel.jpg",
  tree: "https://upload.wikimedia.org/wikipedia/commons/7/72/Vriksasana_Yoga-Asana_Nina-Mel.jpg",
  chair: "https://upload.wikimedia.org/wikipedia/commons/5/59/Utkatasana_Yoga-Asana_Nina-Mel.jpg",
  bridge: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Setubandhasana_oblique_view.JPG",
  savasana: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Shavasana.jpg",
  plank: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Chaturanga_dandasana_1.jpg",
  chaturanga: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Chaturanga-Dandasana_low_Yoga-Asana_Nina-Mel.jpg",
  cobra: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Bhujangasana_Yoga-Asana_Nina-Mel.jpg",
  sideAngle: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Utthita-Parshvakonasana_Yoga-Asana_Nina-Mel.jpg",
  boat: "https://upload.wikimedia.org/wikipedia/commons/3/32/Navasana_Boat_Pose_Yoga_Pose.jpg",
  sunSalutation: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pant_Pratinidhi_1928_Surya_Namaskar_Sequence.jpg",
};

export const YOGA_FLOWS: YogaFlow[] = [
  {
    id: "morning",
    name: "Morning Wake-Up Flow",
    durationLabel: "~6 min",
    durationMins: 6,
    intensity: "gentle",
    met: 2.5,
    description: "Gentle full-body flow to loosen up and get moving",
    steps: [
      { pose: "Cat-Cow", duration: "45 sec", cue: "On hands and knees, arch and round your spine slowly with your breath to warm up the spine.", image: IMG.catCow },
      { pose: "Downward Dog", duration: "30 sec", cue: "Press hips up and back, pedal out your heels to stretch the hamstrings and calves.", image: IMG.downDog },
      { pose: "Low Lunge", duration: "30 sec each side", cue: "Step one foot forward between your hands, sink your hips down to open the hip flexor.", image: IMG.lowLunge },
      { pose: "Standing Forward Fold", duration: "30 sec", cue: "Hinge at the hips, let your head and arms hang heavy to release the low back.", image: IMG.standingFold },
      { pose: "Mountain Pose Reach", duration: "30 sec", cue: "Stand tall, reach both arms overhead, lengthen through the whole body and breathe.", image: IMG.mountain },
    ],
  },
  {
    id: "cooldown",
    name: "Post-Workout Cooldown",
    durationLabel: "~8 min",
    durationMins: 8,
    intensity: "gentle",
    met: 2.3,
    description: "Bring your heart rate down and stretch what you just worked",
    steps: [
      { pose: "Standing Quad Stretch", duration: "30 sec each side", cue: "Hold your ankle behind you, knees together, to stretch the front of the thigh." },
      { pose: "Seated Forward Fold", duration: "45 sec", cue: "Legs extended, hinge forward from the hips (not the back) to stretch the hamstrings.", image: IMG.seatedFold },
      { pose: "Figure-4 Stretch", duration: "30 sec each side", cue: "Lying down, cross one ankle over the opposite knee and pull the leg in to open the glute/hip." },
      { pose: "Child's Pose", duration: "45 sec", cue: "Sit back on your heels, arms extended forward, let your low back and shoulders release.", image: IMG.childsPose },
      { pose: "Supine Twist", duration: "30 sec each side", cue: "Lying on your back, drop both knees to one side, shoulders flat, to unwind the spine.", image: IMG.supineTwist },
    ],
  },
  {
    id: "deep-stretch",
    name: "Deep Stretch & Release",
    durationLabel: "~12 min",
    durationMins: 12,
    intensity: "gentle",
    met: 2.3,
    description: "Longer holds for tight hips, shoulders, and a full nervous-system reset",
    steps: [
      { pose: "Pigeon Pose", duration: "60 sec each side", cue: "Front shin angled under your torso, back leg extended — a deep hip opener. Breathe into any tightness, don't force it.", image: IMG.pigeon },
      { pose: "Thread the Needle", duration: "45 sec each side", cue: "From hands and knees, slide one arm under your body, resting your shoulder down, to open the upper back and shoulder." },
      { pose: "Butterfly Stretch", duration: "45 sec", cue: "Seated, soles of the feet together, gently fold forward to stretch the inner thighs.", image: IMG.butterfly },
      { pose: "Sphinx Pose", duration: "45 sec", cue: "Lying on your stomach, prop up on your forearms, gently arch — a mild backbend to open the chest.", image: IMG.sphinx },
      { pose: "Legs Up the Wall", duration: "2 min", cue: "Lie on your back with legs resting up a wall, arms relaxed at your sides — lets everything settle.", image: IMG.legsUpWall },
    ],
  },
  {
    id: "desk-break",
    name: "Desk Break Flow",
    durationLabel: "~4 min",
    durationMins: 4,
    intensity: "gentle",
    met: 2.0,
    description: "Quick reset you can do right at your desk or in a small space",
    steps: [
      { pose: "Seated Spinal Twist", duration: "20 sec each side", cue: "Sitting tall, twist your torso toward one hand on the back of your chair, keep hips square.", image: IMG.seatedTwist },
      { pose: "Neck Rolls", duration: "30 sec", cue: "Slow, gentle circles both directions — don't force range, just ease tension." },
      { pose: "Wrist & Forearm Stretch", duration: "15 sec each side", cue: "Extend one arm, gently pull fingers back with the other hand to counter typing strain." },
      { pose: "Seated Forward Fold", duration: "30 sec", cue: "In your chair, fold forward over your legs, let your arms and head hang.", image: IMG.seatedFold },
      { pose: "Shoulder Rolls", duration: "20 sec", cue: "Roll shoulders up, back, and down in slow circles to release tension from sitting." },
    ],
  },
  {
    id: "full-25",
    name: "25-Minute Full Flow",
    durationLabel: "~25 min",
    durationMins: 25,
    intensity: "moderate",
    met: 3.0,
    description: "A complete practice — warm-up, standing strength, balance, and a full cool-down",
    steps: [
      { pose: "Mountain Pose", duration: "45 sec", cue: "Stand tall, feet grounded, arms relaxed — settle in and connect with your breath.", image: IMG.mountain },
      { pose: "Cat-Cow", duration: "60 sec", cue: "On hands and knees, arch and round your spine slowly with your breath.", image: IMG.catCow },
      { pose: "Downward Dog", duration: "45 sec", cue: "Press hips up and back, pedal out your heels to stretch hamstrings and calves.", image: IMG.downDog },
      { pose: "Low Lunge", duration: "30 sec each side", cue: "Step one foot forward, sink hips down to open the hip flexor.", image: IMG.lowLunge },
      { pose: "Warrior I", duration: "30 sec each side", cue: "From the lunge, square your hips forward, back heel grounded, arms reach overhead.", image: IMG.warrior1 },
      { pose: "Warrior II", duration: "30 sec each side", cue: "Open hips and arms out to the sides, gaze over your front hand — strong legs, relaxed shoulders.", image: IMG.warrior2 },
      { pose: "Triangle Pose", duration: "30 sec each side", cue: "Straighten your front leg, hinge sideways over it, reach one hand down and one hand up.", image: IMG.triangle },
      { pose: "Tree Pose", duration: "30 sec each side", cue: "Root through one foot, place the other sole on your ankle, calf, or inner thigh (not the knee). Find a focus point to balance.", image: IMG.tree },
      { pose: "Chair Pose", duration: "30 sec", cue: "Bend your knees like sitting into a chair, arms reach up, weight in your heels.", image: IMG.chair },
      { pose: "Seated Forward Fold", duration: "45 sec", cue: "Legs extended, hinge forward from the hips to stretch the hamstrings.", image: IMG.seatedFold },
      { pose: "Butterfly Stretch", duration: "45 sec", cue: "Soles of the feet together, gently fold forward to open the inner thighs.", image: IMG.butterfly },
      { pose: "Bridge Pose", duration: "45 sec", cue: "Lying on your back, knees bent, press through your feet to lift your hips — opens the chest and strengthens the glutes.", image: IMG.bridge },
      { pose: "Supine Twist", duration: "30 sec each side", cue: "Lying on your back, drop both knees to one side, shoulders flat, to unwind the spine.", image: IMG.supineTwist },
      { pose: "Savasana", duration: "3 min", cue: "Lie flat, arms relaxed at your sides, palms up — let everything fully release.", image: IMG.savasana },
    ],
  },
  {
    id: "power-burn",
    name: "Calorie-Burning Power Flow",
    durationLabel: "~20 min",
    durationMins: 20,
    intensity: "power",
    met: 5.0,
    description: "Dynamic, vinyasa-style flow that keeps you moving to raise your heart rate",
    steps: [
      { pose: "Sun Salutation A × 3", duration: "3 min", cue: "Flow through: Mountain → reach up → forward fold → step back to Plank → lower to Chaturanga → Cobra/Up Dog → Downward Dog → step forward → Mountain. Repeat 3 rounds, moving with your breath.", image: IMG.sunSalutation },
      { pose: "Chair Pose", duration: "45 sec", cue: "Sink your hips low like sitting in a chair, arms reach up — hold and feel the legs burn.", image: IMG.chair },
      { pose: "Plank Pose", duration: "45 sec", cue: "Shoulders over wrists, body in one straight line, core engaged.", image: IMG.plank },
      { pose: "Chaturanga to Cobra", duration: "8 reps", cue: "Lower halfway down with elbows hugging in, then push into Cobra, then back to Plank — keep the pace brisk." , image: IMG.chaturanga },
      { pose: "Warrior I", duration: "30 sec each side", cue: "Square hips forward, back heel grounded, arms reach overhead — sink deep into the front knee.", image: IMG.warrior1 },
      { pose: "Warrior II", duration: "30 sec each side", cue: "Open hips and arms out wide, gaze over your front hand, hold strong through the legs.", image: IMG.warrior2 },
      { pose: "Extended Side Angle", duration: "30 sec each side", cue: "From Warrior II, tip your torso over your front leg, reach the top arm long overhead.", image: IMG.sideAngle },
      { pose: "High Lunge with Twist", duration: "20 sec each side", cue: "From a high lunge, twist your torso toward the front knee, hands at heart center — challenges balance and core." },
      { pose: "Boat Pose", duration: "30 sec × 2", cue: "Balance on your sit bones, lift your shins (or straighten legs), chest lifted — core burner.", image: IMG.boat },
      { pose: "Bridge Pose", duration: "45 sec", cue: "Press through your feet to lift your hips, squeeze the glutes at the top.", image: IMG.bridge },
      { pose: "Savasana", duration: "2 min", cue: "Lie flat and let your heart rate settle before you get up.", image: IMG.savasana },
    ],
  },
];

/** Rough calorie estimate from MET value, duration, and bodyweight. */
export function estimateCalories(met: number, durationMins: number, weightLbs: number): number {
  const weightKg = weightLbs * 0.453592;
  return Math.round(met * 3.5 * weightKg / 200 * durationMins);
}
