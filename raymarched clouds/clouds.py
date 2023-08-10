from ursina import *

app = Ursina()

clouds_shader = Shader(language=Shader.GLSL,
                       vertex=open('clouds.vert').read(),
                       fragment=open('clouds.frag').read())

EditorCamera()


Entity(model="cube", texture="white_cube", color=color.red)




sun = DirectionalLight(position = Vec3(3,2,-1), shadows = True)
sun.look_at(Vec3(0,0,0))


camera.shader = clouds_shader
camera.set_shader_input("wind_direction", sun.rotation.normalized()*Vec3(-1,-1,1))
camera.set_shader_input('light_direction', sun.rotation*Vec3(-1,-1,1))
camera.set_shader_input("light_position", Vec3(sun.position.x, sun.position.z, sun.position.y)) 
camera.set_shader_input('light_color', sun.color)
camera.set_shader_input("aspect_ratio", camera.aspect_ratio)

def update():
    camera.set_shader_input("camera_direction", camera.rotation*Vec3(-1,-1,1))
    camera.set_shader_input("camera_position", Vec3(camera.position.x, camera.position.z, camera.position.y))


camera.set_shader_input('density', 0.2)
def input(key):
    if key == "up arrow":
        camera.y += 0.1
    if key == "down arrow":
        camera.y -= 0.1
    if key == "left arrow":
        camera.x -= 0.1
    if key == "right arrow":
        camera.x += 0.1
    if key == "w":
        camera.z += 1
    if key == "s":
        camera.z -= 1

app.run()