package com.dwellio.common.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * Re-normalizes DATABASE_URL after profile .env files are imported (they load after
 * {@link EnvironmentPostProcessor} runs).
 */
public class DatabaseEnvironmentPreparedListener
        implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        if (event.getEnvironment() instanceof ConfigurableEnvironment environment) {
            DatabaseConfigNormalizer.apply(environment);
        }
    }
}
