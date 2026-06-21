package model;

/**
 * Mirror of the User model in DorMsa Node.js.
 */
public class User {
    public String id;
    public String name;
    public String email;
    public String role;
    public String phone;

    public User() {}

    public User(String id, String name, String email, String role, String phone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
    }
}
