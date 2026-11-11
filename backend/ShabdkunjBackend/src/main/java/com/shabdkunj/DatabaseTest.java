
package com.shabdkunj;

import com.shabdkunj.config.DatabaseConfig;
import java.sql.Connection;

public class DatabaseTest {
    public static void main(String[] args) {
        try (Connection connection = DatabaseConfig.getConnection()) {
            System.out.println("MySQL connection successful!");
            System.out.println("Connected to: "
                    + connection.getCatalog());
        } catch (Exception e) {
            System.out.println("Database connection failed!");
            e.printStackTrace();
        }
    }
}
