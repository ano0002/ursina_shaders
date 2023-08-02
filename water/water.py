from ursina import *

app = Ursina()

water = Entity(model=Plane(subdivisions=(320,320)),scale=100)

water_shader = Shader(
vertex=open("water.vert").read(),fragment=open("water.frag").read())

water.shader = water_shader



water.set_shader_input("resolution",32)
water.set_shader_input("amplitude",2)
water.set_shader_input("speed",1)
water.set_shader_input("lightDir",Vec3(-1,0,-0.2).normalized())
water.set_shader_input("lightColor",color.white)
water.set_shader_input("waterColor",color.rgb(50,100,150))
water.set_shader_input("cameraDir",camera.world_rotation.normalized())
water.set_shader_input("cameraPos",camera.world_position)
water.set_shader_input("ambient",0.2)
water.set_shader_input("reflectionTexture",load_texture("skybox2.jpg"))


Sky(texture="skybox2.jpg")



def update():
    water.set_shader_input("cameraDir",camera.world_rotation.normalized())
    water.set_shader_input("cameraPos",camera.world_position)

EditorCamera()

app.run()