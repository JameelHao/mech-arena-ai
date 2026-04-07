import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  playAttackProjectile,
  playHitReaction,
} from "../src/utils/attackEffects";

const MechType = {
  Kinetic: "kinetic",
  Beam: "beam",
  Emp: "emp",
} as const;

/**
 * Mock Phaser objects for animation unit tests.
 * We verify that the animation functions call the correct Phaser APIs
 * with expected parameters, without needing a real Phaser runtime.
 */

interface TweenCall {
  targets: unknown;
  x?: number;
  y?: number;
  duration?: number;
  onComplete?: () => void;
}

interface GraphicsCall {
  method: string;
  args: unknown[];
}

function createMockGraphics() {
  const calls: GraphicsCall[] = [];
  const mock = {
    fillStyle: (...args: unknown[]) =>
      calls.push({ method: "fillStyle", args }),
    fillCircle: (...args: unknown[]) =>
      calls.push({ method: "fillCircle", args }),
    setPosition: (...args: unknown[]) =>
      calls.push({ method: "setPosition", args }),
    setAlpha: (...args: unknown[]) => calls.push({ method: "setAlpha", args }),
    destroy: () => calls.push({ method: "destroy", args: [] }),
    _calls: calls,
  };
  return mock;
}

function createMockScene() {
  const tweenCalls: TweenCall[] = [];
  const createdGraphics: ReturnType<typeof createMockGraphics>[] = [];

  return {
    add: {
      graphics: () => {
        const g = createMockGraphics();
        createdGraphics.push(g);
        return g;
      },
    },
    tweens: {
      add: (config: TweenCall) => {
        tweenCalls.push(config);
        // Auto-complete tween for test purposes
        if (config.onComplete) {
          config.onComplete();
        }
        return {};
      },
    },
    _tweenCalls: tweenCalls,
    _createdGraphics: createdGraphics,
  };
}

function createMockMechSprite(x: number, y: number) {
  return {
    container: { x, y, setAlpha: () => {} },
    graphics: {},
    damageOverlay: { setAlpha: () => {} },
    idleTween: { pause: () => {}, resume: () => {} },
  };
}

describe("playAttackProjectile", () => {
  it("should create a projectile graphic and tween it to target", async () => {
    const scene = createMockScene();
    const attacker = createMockMechSprite(100, 400);
    const target = createMockMechSprite(300, 150);

    await playAttackProjectile(
      scene as never,
      attacker as never,
      target as never,
      MechType.Kinetic,
    );

    // Should have created at least one graphics object (the projectile)
    assert.ok(
      scene._createdGraphics.length >= 1,
      "should create projectile graphics",
    );

    // Should have a tween moving toward target position
    const flyTween = scene._tweenCalls.find((t) => t.x === 300 && t.y === 150);
    assert.ok(flyTween, "should tween projectile to target position");
    assert.equal(
      flyTween.duration,
      350,
      "projectile flight duration should be 350ms",
    );
  });

  it("should handle defense skill type without error", async () => {
    const scene = createMockScene();
    const attacker = createMockMechSprite(100, 400);
    const target = createMockMechSprite(300, 150);

    await playAttackProjectile(
      scene as never,
      attacker as never,
      target as never,
      "defense",
    );

    assert.ok(scene._createdGraphics.length >= 1);
  });

  it("should set projectile initial position at attacker", async () => {
    const scene = createMockScene();
    const attacker = createMockMechSprite(150, 450);
    const target = createMockMechSprite(350, 100);

    await playAttackProjectile(
      scene as never,
      attacker as never,
      target as never,
      MechType.Beam,
    );

    const projectile = scene._createdGraphics[0];
    const posCall = projectile._calls.find((c) => c.method === "setPosition");
    assert.ok(posCall, "should call setPosition on projectile");
    assert.deepEqual(
      posCall.args,
      [150, 450],
      "should set position at attacker coords",
    );
  });

  it("should destroy projectile after flight", async () => {
    const scene = createMockScene();
    const attacker = createMockMechSprite(100, 400);
    const target = createMockMechSprite(300, 150);

    await playAttackProjectile(
      scene as never,
      attacker as never,
      target as never,
      MechType.Emp,
    );

    const projectile = scene._createdGraphics[0];
    const destroyed = projectile._calls.some((c) => c.method === "destroy");
    assert.ok(
      destroyed,
      "projectile should be destroyed after reaching target",
    );
  });
});

describe("playHitReaction", () => {
  it("should create explosion graphics and shake the target", async () => {
    const scene = createMockScene();
    const target = createMockMechSprite(300, 150);

    await playHitReaction(scene as never, target as never, MechType.Kinetic);

    // Should create explosion + spark graphics
    // 1 explosion + 6 sparks = at least 7
    assert.ok(
      scene._createdGraphics.length >= 7,
      `should create explosion + sparks, got ${scene._createdGraphics.length}`,
    );

    // Should have a shake tween on the container
    const shakeTween = scene._tweenCalls.find(
      (t) => t.targets === target.container && t.duration === 40,
    );
    assert.ok(shakeTween, "should add shake tween to target container");
  });

  it("should set explosion position at target", async () => {
    const scene = createMockScene();
    const target = createMockMechSprite(250, 200);

    await playHitReaction(scene as never, target as never, MechType.Emp);

    const explosion = scene._createdGraphics[0];
    const posCall = explosion._calls.find((c) => c.method === "setPosition");
    assert.ok(posCall, "explosion should have setPosition");
    assert.deepEqual(posCall.args, [250, 200], "explosion at target position");
  });

  it("should restore target container x after shake", async () => {
    const scene = createMockScene();
    const target = createMockMechSprite(300, 150);

    await playHitReaction(scene as never, target as never, MechType.Beam);

    // After the shake tween completes (auto-completed by mock),
    // container.x should be restored to original value
    assert.equal(target.container.x, 300, "x should be restored after shake");
  });

  it("should create expand+fade tween for explosion", async () => {
    const scene = createMockScene();
    const target = createMockMechSprite(300, 150);

    await playHitReaction(scene as never, target as never, MechType.Kinetic);

    const explosion = scene._createdGraphics[0];
    // Find the explosion expand tween (targets the explosion graphics, duration 350)
    const expandTween = scene._tweenCalls.find(
      (t) => t.targets === explosion && t.duration === 350,
    );
    assert.ok(expandTween, "should have explosion expand tween");
  });
});
