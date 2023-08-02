from ursina import *

app = Ursina()

sprite = Entity(model="quad",scale=10,texture="sprite.png",collider="box",z=10)

outline_shader = Shader(
vertex=open("outline.vert").read(),fragment=open("outline.frag").read(),
)

sprite.shader = outline_shader

hue = 1

sprite.set_shader_input("outline_thickness",1)
sprite.set_shader_input("sprite_size",sprite.texture.size)



Sky(texture="skybox.jpg")

def update():
    global hue
    hue += 5
    hue %= 360
    sprite.set_shader_input("outline_color",color.hsv(hue,1,1))

EditorCamera()

app.run()