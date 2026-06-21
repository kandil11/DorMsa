package ioc.container;

import ioc.annotations.Autowired;
import ioc.annotations.Component;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.*;

/**
 * A lightweight, custom Inversion of Control (IoC) container.
 * It manages bean lifecycles (singletons) and performs Dependency Injection (DI)
 * via reflection for fields annotated with @Autowired.
 */
public class IoCContainer {
    // Stores registered component classes
    private final Set<Class<?>> registeredClasses = new HashSet<>();
    // Stores instantiated singleton bean instances: class type -> bean instance
    private final Map<Class<?>, Object> beans = new HashMap<>();
    // Stores component assembly mapping configurations
    private final Properties componentConfig = new Properties();

    public IoCContainer() {
        loadConfig();
    }

    private void loadConfig() {
        File configFile = new File("components.config");
        if (configFile.exists()) {
            try (java.io.FileInputStream fis = new java.io.FileInputStream(configFile)) {
                componentConfig.load(fis);
                System.out.println("⚙️ [IoC] Loaded component assembly configuration from components.config");
            } catch (IOException e) {
                System.err.println("⚠️ [IoC] Failed to load components.config: " + e.getMessage());
            }
        }
    }

    /**
     * Explicitly register component classes.
     */
    public void register(Class<?>... classes) {
        for (Class<?> clazz : classes) {
            if (clazz.isAnnotationPresent(Component.class)) {
                registeredClasses.add(clazz);
            }
        }
    }

    /**
     * Scan a directory/package recursively for classes annotated with @Component.
     * This simulates how Spring's @ComponentScan works!
     */
    public void scanPackage(String packageName) {
        String path = packageName.replace('.', '/');
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        try {
            System.out.println("🔍 [IoC Debug] Scanning package: " + packageName + " (path: " + path + ")");
            Enumeration<URL> resources = classLoader.getResources(path);
            List<File> dirs = new ArrayList<>();
            if (!resources.hasMoreElements()) {
                System.out.println("⚠️ [IoC Debug] No resources found for package path: " + path);
            }
            while (resources.hasMoreElements()) {
                URL resource = resources.nextElement();
                System.out.println("🔍 [IoC Debug] Found resource: " + resource);
                String filePath = resource.getFile().replace("%20", " ");
                System.out.println("🔍 [IoC Debug] Decoded file path: " + filePath);
                dirs.add(new File(filePath));
            }
            for (File directory : dirs) {
                System.out.println("🔍 [IoC Debug] Scanning directory: " + directory.getAbsolutePath());
                findClasses(directory, packageName);
            }
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("Error scanning package " + packageName + ": " + e.getMessage());
        }
    }

    private void findClasses(File directory, String packageName) throws ClassNotFoundException {
        if (!directory.exists()) {
            return;
        }
        File[] files = directory.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.isDirectory()) {
                findClasses(file, packageName + "." + file.getName());
            } else if (file.getName().endsWith(".class")) {
                String className = packageName + '.' + file.getName().substring(0, file.getName().length() - 6);
                Class<?> clazz = Class.forName(className);
                if (clazz.isAnnotationPresent(Component.class) && !clazz.isInterface()) {
                    registeredClasses.add(clazz);
                }
            }
        }
    }

    /**
     * Instantiates all registered components and wires their dependencies.
     */
    public void bootstrap() {
        System.out.println("🌱 [IoC] Starting container bootstrap...");
        
        // Step 1: Instantiate all classes
        for (Class<?> clazz : registeredClasses) {
            try {
                System.out.println("🌱 [IoC] Instantiating bean: " + clazz.getSimpleName());
                Object instance = clazz.getDeclaredConstructor().newInstance();
                beans.put(clazz, instance);
            } catch (Exception e) {
                throw new RuntimeException("Failed to instantiate bean of type: " + clazz.getName(), e);
            }
        }

        // Step 2: Inject dependencies (Wiring phase)
        for (Map.Entry<Class<?>, Object> entry : beans.entrySet()) {
            Object instance = entry.getValue();
            Class<?> clazz = entry.getKey();
            wireDependencies(instance, clazz);
        }
        
        System.out.println("✅ [IoC] Bootstrap completed successfully. Managed beans: " + beans.size());
    }

    /**
     * Inspects fields of a class, looking for @Autowired annotations and setting dependencies.
     */
    private void wireDependencies(Object instance, Class<?> clazz) {
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            if (field.isAnnotationPresent(Autowired.class)) {
                Class<?> dependencyType = field.getType();
                System.out.println("🔗 [IoC] Injection: " + clazz.getSimpleName() + "." + field.getName() + " -> Resolving type: " + dependencyType.getSimpleName());
                
                Object dependency = getBean(dependencyType);
                if (dependency == null) {
                    throw new RuntimeException("Unsatisfied dependency of type [" + dependencyType.getName() + "] required by bean [" + clazz.getName() + "]");
                }

                try {
                    field.setAccessible(true);
                    field.set(instance, dependency);
                } catch (IllegalAccessException e) {
                    throw new RuntimeException("Failed to inject field: " + field.getName() + " in " + clazz.getName(), e);
                }
            }
        }
    }

    /**
     * Retrieves a bean from the container matching the requested class or interface type.
     * Incorporates Component-Based Programming principles by resolving interfaces using 
     * external assembly configuration mappings (components.config) if present.
     */
    @SuppressWarnings("unchecked")
    public <T> T getBean(Class<T> clazz) {
        // 1. Direct type match
        if (beans.containsKey(clazz)) {
            return (T) beans.get(clazz);
        }

        // 2. Component Configuration mapping override (Component Assembly phase)
        if (clazz.isInterface()) {
            String configClassName = componentConfig.getProperty(clazz.getSimpleName());
            if (configClassName != null) {
                try {
                    Class<?> concreteClazz = Class.forName(configClassName);
                    if (beans.containsKey(concreteClazz)) {
                        return (T) beans.get(concreteClazz);
                    }
                } catch (ClassNotFoundException e) {
                    System.err.println("⚠️ [IoC Config] Configured component class not found: " + configClassName);
                }
            }
        }

        // 3. Fallback: Match by subclass or interface implementation
        for (Map.Entry<Class<?>, Object> entry : beans.entrySet()) {
            if (clazz.isAssignableFrom(entry.getKey())) {
                return (T) entry.getValue();
            }
        }
        return null;
    }

    /**
     * Retrieves all beans in the container.
     */
    public Collection<Object> getAllBeans() {
        return beans.values();
    }
}
