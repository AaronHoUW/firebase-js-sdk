import { _registerComponent, registerVersion } from '@firebase/app';
import { FirebaseAnalyticsInternal } from '@firebase/analytics-interop-types';
import { factory } from './factory';
import { ANALYTICS_TYPE } from './constants';
import { Component, ComponentType, ComponentContainer, InstanceFactoryOptions } from '@firebase/component';
import { ERROR_FACTORY, AnalyticsError } from './errors';
import { logEvent } from './api';
import { name, version } from '../package.json';
import { AnalyticsCallOptions } from './public-types';
import '@firebase/installations';

function registerAnalytics(): void {
  _registerComponent(
    new Component(
      ANALYTICS_TYPE,
      (container, { options: analyticsOptions }: InstanceFactoryOptions) => {
        const app = container.getProvider('app').getImmediate();
        const installations = container.getProvider('installations-internal').getImmediate();

        return factory(app, installations, analyticsOptions);
      },
      ComponentType.PUBLIC
    )
  );

  _registerComponent(
    new Component('analytics-internal', internalFactory, ComponentType.PRIVATE)
  );

  registerVersion(name, version);
  registerVersion(name, version, '__BUILD_TARGET__');

  function internalFactory(container: ComponentContainer): FirebaseAnalyticsInternal {
    try {
      const analytics = container.getProvider(ANALYTICS_TYPE).getImmediate();
      return {
        logEvent: (
          eventName: string,
          eventParams?: { [key: string]: unknown },
          options?: AnalyticsCallOptions
        ) => logEvent(analytics, eventName, eventParams, options)
      };
    } catch (e) {
      throw ERROR_FACTORY.create(AnalyticsError.INTEROP_COMPONENT_REG_FAILED, { reason: e as Error });
    }
  }
}

export default registerAnalytics;
