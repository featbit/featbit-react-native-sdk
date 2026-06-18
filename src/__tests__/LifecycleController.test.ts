import { LifecycleController } from '../LifecycleController';

const GRACE = 20_000;

describe('LifecycleController', () => {
  let pause: jest.Mock;
  let resume: jest.Mock;
  let controller: LifecycleController;

  beforeEach(() => {
    jest.useFakeTimers();
    pause = jest.fn();
    resume = jest.fn();
    controller = new LifecycleController(GRACE, pause, resume);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('starts active (foreground + online)', () => {
    expect(controller.isActive).toBe(true);
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('pauses after the grace period when backgrounded', () => {
    controller.onForegroundChanged(false);
    expect(pause).not.toHaveBeenCalled(); // debounced

    jest.advanceTimersByTime(GRACE);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(controller.isActive).toBe(false);
  });

  it('does not pause if foregrounded again within the grace period', () => {
    controller.onForegroundChanged(false);
    jest.advanceTimersByTime(GRACE - 1);
    controller.onForegroundChanged(true);
    jest.advanceTimersByTime(GRACE);

    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled(); // never actually paused, so nothing to resume
    expect(controller.isActive).toBe(true);
  });

  it('resumes on return to foreground after a pause', () => {
    controller.onForegroundChanged(false);
    jest.advanceTimersByTime(GRACE);
    expect(pause).toHaveBeenCalledTimes(1);

    controller.onForegroundChanged(true);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(controller.isActive).toBe(true);
  });

  it('pauses when offline and resumes when connectivity returns', () => {
    controller.onNetworkChanged(false);
    jest.advanceTimersByTime(GRACE);
    expect(pause).toHaveBeenCalledTimes(1);

    controller.onNetworkChanged(true);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('requires BOTH foreground and online to become active again', () => {
    controller.onForegroundChanged(false);
    controller.onNetworkChanged(false);
    jest.advanceTimersByTime(GRACE);
    expect(pause).toHaveBeenCalledTimes(1);

    // back online but still backgrounded -> stays paused
    controller.onNetworkChanged(true);
    expect(resume).not.toHaveBeenCalled();

    // now also foregrounded -> resumes
    controller.onForegroundChanged(true);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('coalesces overlapping inactive signals into a single pause', () => {
    controller.onForegroundChanged(false);
    controller.onNetworkChanged(false); // must not schedule a second pause timer
    jest.advanceTimersByTime(GRACE);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('dispose() cancels a pending pause', () => {
    controller.onForegroundChanged(false);
    controller.dispose();
    jest.advanceTimersByTime(GRACE);
    expect(pause).not.toHaveBeenCalled();
  });
});
