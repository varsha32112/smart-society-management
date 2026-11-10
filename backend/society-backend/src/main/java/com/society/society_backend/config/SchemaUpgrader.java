
package com.society.society_backend.config;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

// Keeps the hosted PostgreSQL role rule in step with the Role list.
// Safe to run on every start. It does nothing on other databases.
@Component
public class SchemaUpgrader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaUpgrader.class);

    private static final String DROP_OLD_ROLE_RULES =
            "DO $$ DECLARE r record; BEGIN "
                    + "FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = to_regclass('users') "
                    + "AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%' "
                    + "LOOP EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(r.conname); END LOOP; END $$";

    private static final String ADD_ROLE_RULE =
            "ALTER TABLE users ADD CONSTRAINT users_role_check "
                    + "CHECK (role IN ('ADMIN','RESIDENT','SECURITY','HOUSEKEEPING'))";

    private final EntityManager entityManager;
    private final PlatformTransactionManager transactionManager;
    private final String datasourceUrl;

    public SchemaUpgrader(EntityManager entityManager,
                          PlatformTransactionManager transactionManager,
                          @Value("${spring.datasource.url:}") String datasourceUrl) {
        this.entityManager = entityManager;
        this.transactionManager = transactionManager;
        this.datasourceUrl = datasourceUrl;
    }

    @Override
    public void run(String... args) {
        if (!datasourceUrl.startsWith("jdbc:postgresql:")) {
            return;
        }
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                entityManager.createNativeQuery(DROP_OLD_ROLE_RULES).executeUpdate();
                entityManager.createNativeQuery(ADD_ROLE_RULE).executeUpdate();
            });
        } catch (RuntimeException e) {
            log.warn("Could not update the role rule on the database: {}", e.getMessage());
        }
    }
}
